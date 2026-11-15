const assert = require("node:assert/strict");
const { test } = require("node:test");
const app = require("../server");
const mongoose = require("mongoose");
const Project = require("../models/Project");
const Skill = require("../models/Skill");
const Experience = require("../models/Experience");
const Education = require("../models/Education");
const Service = require("../models/Service");
const Certification = require("../models/Certification");
const Contact = require("../models/Contact");
const Feedback = require("../models/Feedback");
const Profile = require("../models/Profile");
const connectDatabase = require("../config/db");
const { MongoMemoryServer } = require("mongodb-memory-server");

const records = {
  projects: [],
  skills: [],
  experience: [],
  education: [],
  services: [],
  certifications: [],
  contacts: [],
  feedback: []
};
let profile = null;
let nextId = 1;

function addRecord(collection, data) {
  const record = {
    _id: `abcdefabcdefabcdef${String(nextId++).padStart(6, "0")}`,
    createdAt: new Date().toISOString(),
    ...data
  };
  record.id = record._id;
  collection.push(record);
  return record;
}

function query(collection) {
  return {
    sort() { return this; },
    lean() { return Promise.resolve(collection.map((record) => ({ ...record }))); }
  };
}

function installPublicModel(Model, collection) {
  Model.find = () => query(collection);
}

installPublicModel(Project, records.projects);
installPublicModel(Skill, records.skills);
installPublicModel(Experience, records.experience);
installPublicModel(Education, records.education);
installPublicModel(Service, records.services);
installPublicModel(Certification, records.certifications);

Contact.create = async (data) => addRecord(records.contacts, data);
Feedback.create = async (data) => addRecord(records.feedback, data);
Profile.findOne = () => ({ lean: async () => (profile ? { ...profile } : null) });

test("in-memory MongoDB requires explicit opt-in and can be stopped cleanly", async () => {
  const originalConnect = mongoose.connect;
  const originalCreate = MongoMemoryServer.create;
  const originalReadyState = mongoose.connection.readyState;
  const originalMongoUri = process.env.MONGO_URI;
  const originalMemoryOptIn = process.env.ALLOW_IN_MEMORY_DATABASE;
  const attempts = [];
  const memoryUri = "mongodb://memory.test:27017/portfolio";

  mongoose.connection.readyState = 0;
  mongoose.connect = async (uri) => {
    attempts.push(uri);
    if (uri !== memoryUri) throw new Error("MongoDB unavailable.");
    return mongoose;
  };
  MongoMemoryServer.create = async () => ({ getUri: () => memoryUri, stop: async () => {} });
  process.env.MONGO_URI = "mongodb://configured.test:27017/portfolio";
  delete process.env.ALLOW_IN_MEMORY_DATABASE;

  try {
    await assert.rejects(connectDatabase(), /Unable to connect to MongoDB/);
    assert.deepEqual(attempts, ["mongodb://configured.test:27017/portfolio"]);

    attempts.length = 0;
    process.env.ALLOW_IN_MEMORY_DATABASE = "true";
    await connectDatabase();
    assert.deepEqual(attempts, [
      "mongodb://configured.test:27017/portfolio",
      memoryUri
    ]);

    await connectDatabase.disconnect();
  } finally {
    mongoose.connect = originalConnect;
    MongoMemoryServer.create = originalCreate;
    mongoose.connection.readyState = originalReadyState;
    if (originalMongoUri === undefined) delete process.env.MONGO_URI;
    else process.env.MONGO_URI = originalMongoUri;
    if (originalMemoryOptIn === undefined) delete process.env.ALLOW_IN_MEMORY_DATABASE;
    else process.env.ALLOW_IN_MEMORY_DATABASE = originalMemoryOptIn;
  }
});

test("public portfolio APIs, submissions, validation, and removed routes", async (t) => {
  const initialDatabaseState = mongoose.connection.readyState;
  records.projects.length = 0;
  records.skills.length = 0;
  records.experience.length = 0;
  records.education.length = 0;
  records.services.length = 0;
  records.certifications.length = 0;
  records.contacts.length = 0;
  records.feedback.length = 0;
  profile = { name: "Portfolio Owner" };

  const server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  t.after(() => {
    server.close();
    server.closeAllConnections();
    mongoose.connection.readyState = initialDatabaseState;
  });

  const base = `http://127.0.0.1:${server.address().port}`;
  const send = async (path, options = {}) => {
    const response = await fetch(`${base}${path}`, {
      ...options,
      headers: { "Content-Type": "application/json", ...options.headers }
    });
    const text = response.status === 204 ? "" : await response.text();
    return {
      status: response.status,
      body: text ? JSON.parse(text) : null,
      headers: response.headers
    };
  };

  const health = await send("/api/health");
  assert.equal(health.status, 503);
  assert.match(health.headers.get("content-security-policy"), /img-src[^;]*http:/);
  assert.match(health.headers.get("content-security-policy"), /img-src[^;]*https:/);

  const corsCheck = await send("/api/projects", {
    headers: { Origin: "http://localhost:5502" }
  });
  assert.equal(corsCheck.status, 503);
  assert.equal(corsCheck.headers.get("access-control-allow-origin"), "http://localhost:5502");
  assert.equal((await send("/api/projects", {
    headers: { Origin: "https://not-allowed.example" }
  })).status, 403);
  const disconnected = await send("/api/projects");
  assert.equal(disconnected.status, 503);
  assert.equal(disconnected.body.error, "DATABASE_UNAVAILABLE");

  mongoose.connection.readyState = 1;
  addRecord(records.projects, {
    title: "Test project",
    description: "A project returned by the public portfolio API.",
    technologies: ["HTML", "JavaScript"],
    githubUrl: "https://github.com/example/project"
  });
  addRecord(records.skills, { name: "JavaScript", percentage: 80 });
  addRecord(records.education, { degree: "BSc", institution: "Example College" });
  addRecord(records.experience, { title: "Developer", company: "Example Co." });
  addRecord(records.services, { title: "Web development", description: "Responsive websites." });
  addRecord(records.certifications, { name: "Test certification", issuer: "Example issuer" });

  assert.equal((await send("/api/health")).status, 200);
  const projects = await send("/api/projects");
  assert.equal(projects.status, 200);
  assert.equal(projects.body.data[0].title, "Test project");
  const portfolio = await send("/api/portfolio");
  assert.equal(portfolio.status, 200);
  assert.equal(portfolio.body.data.profile.name, "Portfolio Owner");
  assert.equal(portfolio.body.data.skills.length, 1);
  assert.equal(portfolio.body.data.education.length, 1);
  assert.equal(portfolio.body.data.experience.length, 1);
  assert.equal(portfolio.body.data.services.length, 1);
  assert.equal(portfolio.body.data.certifications[0].name, "Test certification");
  assert.equal((await send("/api/portfolio", { method: "POST", body: "{}" })).status, 404);
  assert.equal((await send("/api/auth/login", { method: "POST", body: "{}" })).status, 404);
  assert.equal((await send("/api/unknown")).status, 404);
  assert.equal((await send("/api/submissions/contact", { method: "POST", body: "{" })).status, 400);

  const invalidContact = await send("/api/submissions/contact", {
    method: "POST",
    body: JSON.stringify({ fullName: "A", email: "invalid", message: "short" })
  });
  assert.equal(invalidContact.status, 400);
  assert.ok(invalidContact.body.errors.length >= 3);

  const contact = await send("/api/submissions/contact", {
    method: "POST",
    body: JSON.stringify({
      fullName: "Visitor Example",
      email: "visitor@example.com",
      phone: "",
      message: "Please get in touch about a project."
    })
  });
  assert.equal(contact.status, 201);
  assert.equal(contact.body.success, true);
  assert.equal(records.contacts.length, 1);

  const feedback = await send("/api/submissions/feedback", {
    method: "POST",
    body: JSON.stringify({
      name: "Visitor Example",
      subject: "Nice portfolio",
      message: "The portfolio is clear and easy to use."
    })
  });
  assert.equal(feedback.status, 201);
  assert.equal(feedback.body.success, true);
  assert.equal(records.feedback.length, 1);
});
