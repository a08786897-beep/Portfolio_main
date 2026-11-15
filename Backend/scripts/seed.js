require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });

const connectDatabase = require("../config/db");
const disconnectDatabase = connectDatabase.disconnect;
const Project = require("../models/Project");
const Skill = require("../models/Skill");
const Education = require("../models/Education");
const Service = require("../models/Service");
const Profile = require("../models/Profile");

async function seedIfEmpty(Model, records) {
  if (await Model.exists({})) return;
  await Model.insertMany(records);
  console.info(`Added ${records.length} starter ${Model.collection.collectionName} record(s).`);
}

async function seed() {
  await connectDatabase();

  if (!(await Profile.exists({}))) {
    await Profile.create({
      name: "Anshul Arora",
      headline: "AI & ML Student",
      subtitle: "Passionate AI & ML Student | DSA Enthusiast | Frontend Developer | Problem Solver.",
      about: "AI & ML student focused on software engineering, problem-solving, and modern web development.",
      email: "a08786897@gmail.com",
      phone: "+91 93358 11154",
      location: "India"
    });
  }

  await seedIfEmpty(Project, [
    {
      title: "Rock-Paper-Scissors Game",
      description: "Responsive game with smooth UI feedback and clean JavaScript logic.",
      technologies: ["HTML", "CSS", "JavaScript"],
      githubUrl: "https://github.com/a08786897-beep/rock-paper-scissors-project",
      liveDemoUrl: "https://a08786897-beep.github.io/rock-paper-scissors-project/",
      category: "Web Development"
    },
    {
      title: "ChatBot",
      description: "Responsive chatbot with smooth UI feedback and clean JavaScript logic.",
      technologies: ["HTML", "CSS", "JavaScript", "React"],
      githubUrl: "https://github.com/a08786897-beep/ChatBot-basic-",
      liveDemoUrl: "https://a08786897-beep.github.io/ChatBot-basic-/",
      category: "Web Development"
    },
    {
      title: "Personal Portfolio",
      description: "Responsive portfolio focused on clear presentation and accessible interactions.",
      technologies: ["HTML", "CSS", "JavaScript"],
      githubUrl: "",
      liveDemoUrl: "",
      category: "Web Development"
    }
  ]);

  await Project.updateMany(
    {
      githubUrl: "https://github.com/a08786897-beep/Protfolio",
      liveDemoUrl: "https://a08786897-beep.github.io/Protfolio/"
    },
    { $set: { githubUrl: "", liveDemoUrl: "" } }
  );

  await seedIfEmpty(Skill, [
    { name: "C++", category: "Programming", percentage: 90, order: 1 },
    { name: "JavaScript", category: "Development", percentage: 75, order: 2 },
    { name: "HTML", category: "Development", percentage: 90, order: 3 },
    { name: "CSS", category: "Development", percentage: 88, order: 4 },
    { name: "Data Structures & Algorithms", category: "Computer Science", percentage: 80, order: 5 },
    { name: "OOP", category: "Computer Science", percentage: 80, order: 6 }
  ]);

  await seedIfEmpty(Education, [{
    degree: "B.Tech — CSE (AI & Machine Learning)",
    current: true,
    description: "Currently pursuing • 2nd Year. Core: AI/ML concepts, data structures, programming fundamentals."
  }]);

  await seedIfEmpty(Service, [
    { title: "Frontend Development", description: "Responsive, accessible interfaces built with modern HTML, CSS, and JavaScript.", order: 1 },
    { title: "Web UI Implementation", description: "Polished user interfaces translated from product ideas into usable web experiences.", order: 2 },
    { title: "Problem Solving", description: "Algorithmic thinking and data structures applied to practical software challenges.", order: 3 }
  ]);

  return { seeded: true };
}

if (require.main === module) {
  seed()
    .catch((error) => {
      console.error("Unable to seed portfolio data:", error.message);
      process.exitCode = 1;
    })
    .finally(disconnectDatabase);
}

module.exports = { seed, seedIfEmpty };
