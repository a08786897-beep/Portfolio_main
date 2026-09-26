process.env.JWT_SECRET = "local-test-secret-that-is-long-enough-for-jwt-signing";

const assert = require("node:assert/strict");
const { test } = require("node:test");
const app = require("../server");
const mongoose = require("mongoose");
const User = require("../models/User");
const Project = require("../models/Project");
const Skill = require("../models/Skill");
const Experience = require("../models/Experience");
const Education = require("../models/Education");
const Service = require("../models/Service");
const Contact = require("../models/Contact");
const Feedback = require("../models/Feedback");
const Profile = require("../models/Profile");

const id = "abcdefabcdefabcdefabcdef";
const records = {
  projects: [],
  skills: [],
  experience: [],
  education: [],
  services: [],
  contacts: [],
  feedback: []
};
let profile = null;
let nextId = 1;

function addRecord(collection, data) {
  const record = {
    _id: `${id.slice(0, 18)}${String(nextId++).padStart(6, "0")}`,
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
    limit() { return this; },
    lean() { return Promise.resolve(collection.map((record) => ({ ...record }))); }
  };
}

function installCrudModel(Model, collection) {
  Model.find = () => query(collection);
  Model.create = async (data) => addRecord(collection, data);
  Model.findByIdAndUpdate = async (recordId, update) => {
    const record = collection.find((item) => item._id === recordId);
    if (!record) return null;
    Object.assign(record, update.$set || update);
    return { ...record };
  };
  Model.findByIdAndDelete = async (recordId) => {
    const index = collection.findIndex((item) => item._id === recordId);
    return index < 0 ? null : collection.splice(index, 1)[0];
  };
}

installCrudModel(Project, records.projects);
installCrudModel(Skill, records.skills);
installCrudModel(Experience, records.experience);
installCrudModel(Education, records.education);
installCrudModel(Service, records.services);

Contact.create = async (data) => addRecord(records.contacts, { read: false, ...data });
Contact.find = () => query(records.contacts);
Contact.findByIdAndUpdate = async (recordId, update) => {
  const record = records.contacts.find((item) => item._id === recordId);
  if (!record) return null;
  Object.assign(record, update);
  return { ...record };
};
Contact.findByIdAndDelete = async (recordId) => {
  const index = records.contacts.findIndex((item) => item._id === recordId);
  return index < 0 ? null : records.contacts.splice(index, 1)[0];
};

Feedback.create = async (data) => addRecord(records.feedback, data);
Feedback.find = () => query(records.feedback);
Feedback.findByIdAndDelete = async (recordId) => {
  const index = records.feedback.findIndex((item) => item._id === recordId);
  return index < 0 ? null : records.feedback.splice(index, 1)[0];
};

Profile.findOne = () => ({ lean: async () => (profile ? { ...profile } : null) });
Profile.findOneAndUpdate = async (filter, update) => {
  profile = { ...(profile || {}), ...(update.$set || update) };
  return { ...profile };
};

const admin = {
  _id: id,
  id,
  email: "admin.name+portfolio@gmail.com",
  role: "admin",
  tokenVersion: 0,
  comparePassword: async (password) => password === "correct-test-password",
  save: async function save() { return this; }
};
User.findOne = () => ({ select: async () => admin });
User.findById = () => ({ select: async () => admin });

test("visitor submissions and authenticated admin content management", async (t) => {
  const initialDatabaseState = mongoose.connection.readyState;
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
    return {
      status: response.status,
      body: response.status === 204 ? null : await response.json(),
      headers: response.headers
    };
  };

  assert.equal((await send("/api/health")).status, 503);
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
  assert.equal((await send("/api/admin/projects")).status, 401);
  assert.equal((await send("/api/auth/logout", { method: "POST", body: "{}" })).status, 401);
  mongoose.connection.readyState = 1;
  assert.equal((await send("/api/admin/projects")).status, 401);
  assert.equal((await send("/api/submissions/contact", {
    method: "POST",
    body: JSON.stringify({ fullName: "A", email: "invalid", message: "short" })
  })).status, 400);

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

  const feedback = await send("/api/submissions/feedback", {
    method: "POST",
    body: JSON.stringify({
      name: "Visitor Example",
      subject: "Nice portfolio",
      message: "The portfolio is clear and easy to use."
    })
  });
  assert.equal(feedback.status, 201);

  const deniedLogin = await send("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: admin.email, password: "incorrect" })
  });
  assert.equal(deniedLogin.status, 401);

  const login = await send("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: admin.email, password: "correct-test-password" })
  });
  assert.equal(login.status, 200);
  const authorization = { Authorization: `Bearer ${login.body.data.token}` };
  assert.equal((await send("/api/admin/messages", { headers: authorization })).body.data.length, 1);
  assert.equal((await send("/api/admin/feedback", { headers: authorization })).body.data.length, 1);

  const project = await send("/api/admin/projects", {
    method: "POST",
    headers: authorization,
    body: JSON.stringify({
      title: "Test project",
      description: "A test project created through the protected API.",
      technologies: ["HTML", "JavaScript"]
    })
  });
  assert.equal(project.status, 201);
  const projectId = project.body.data._id;
  assert.equal((await send("/api/projects")).body.data[0].title, "Test project");
  assert.equal((await send(`/api/admin/projects/${projectId}`, {
    method: "PUT",
    headers: authorization,
    body: JSON.stringify({ title: "Updated test project" })
  })).body.data.title, "Updated test project");

  const managedRecords = [];
  for (const [resource, payload, update] of [
    ["skills", { name: "Testing", percentage: 80 }, { percentage: 70 }],
    ["experience", { title: "Developer", company: "Example Co." }, { location: "Remote" }],
    ["education", { degree: "BSc", institution: "Example College" }, { endDate: "2027" }],
    ["services", { title: "Web development", description: "Responsive websites for small projects." }, { description: "Responsive portfolio websites for small projects." }]
  ]) {
    const created = await send(`/api/admin/${resource}`, {
      method: "POST",
      headers: authorization,
      body: JSON.stringify(payload)
    });
    assert.equal(created.status, 201);
    managedRecords.push({ resource, id: created.body.data._id, update });
  }

  await send("/api/admin/profile", {
    method: "PATCH",
    headers: authorization,
    body: JSON.stringify({ name: "Updated Portfolio Owner" })
  });
  const portfolio = await send("/api/portfolio");
  assert.equal(portfolio.body.data.profile.name, "Updated Portfolio Owner");
  assert.equal(portfolio.body.data.skills.length, 1);
  assert.equal(portfolio.body.data.education.length, 1);
  assert.equal(portfolio.body.data.experience.length, 1);
  assert.equal(portfolio.body.data.services.length, 1);

  for (const record of managedRecords) {
    assert.equal((await send(`/api/admin/${record.resource}/${record.id}`, {
      method: "PUT",
      headers: authorization,
      body: JSON.stringify(record.update)
    })).status, 200);
    assert.equal((await send(`/api/admin/${record.resource}/${record.id}`, {
      method: "DELETE",
      headers: authorization
    })).status, 204);
  }

  const messageId = records.contacts[0]._id;
  assert.equal((await send(`/api/admin/messages/${messageId}`, {
    method: "PATCH",
    headers: authorization,
    body: JSON.stringify({ read: true })
  })).body.data.read, true);
  assert.equal((await send(`/api/admin/messages/${messageId}`, {
    method: "DELETE",
    headers: authorization
  })).status, 204);
  const feedbackId = records.feedback[0]._id;
  assert.equal((await send(`/api/admin/feedback/${feedbackId}`, {
    method: "DELETE",
    headers: authorization
  })).status, 204);

  assert.equal((await send(`/api/admin/projects/${projectId}`, {
    method: "DELETE",
    headers: authorization
  })).status, 204);
  assert.equal((await send("/api/auth/logout", {
    method: "POST",
    headers: authorization,
    body: "{}"
  })).status, 200);
  assert.equal((await send("/api/admin/messages", { headers: authorization })).status, 401);
});
