#!/usr/bin/env node

const { execSync } = require("child_process");

const runCommand = (command) => {
  try {
    execSync(`${command}`, { stdio: "inherit" });
    return true;
  } catch (error) {
    console.error(`Failed to execute ${command}`, error);
    return false;
  }
};

const setupProject = () => {
  const projectName = process.argv[2];

  if (!projectName) {
    console.log("Please provide a project name.");
    console.log("Usage: node setup-project.js <project-name>");
    process.exit(1);
  }

  const gitCheckoutCommand = `git clone https://github.com/Akshaygore1/kubernates-management.git ${projectName}`;
  const installDepsCommand = `cd ${projectName} && npm install`;

  console.log(`Setting up project: ${projectName}`);

  const checkedOut = runCommand(gitCheckoutCommand);
  if (!checkedOut) process.exit(1);

  console.log(`Installing dependencies for ${projectName}`);
  const installedDeps = runCommand(installDepsCommand);
  if (!installedDeps) process.exit(1);

  console.log("Congratulations! You're ready to start.");
  console.log(`
    cd ${projectName}
    npm start
  `);
};

setupProject();
