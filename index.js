const inquirer = require("inquirer");
const git = require("simple-git")(process.cwd());

const BOOL_ANSWER = {
	TRUE: "Yes",
	FALSE: "No"
};

const TASKS = {
	UNDO_COMMIT: "Undo a commit",
	REVERT_FILE: "Revert file(s)"
};

const QUESTIONS = {
	task: {
		type: "list",
		name: "task",
		message: "What do you want to do?",
		choices: getValues(TASKS)
	},
	isPushed: {
		type: "list",
		name: "is_pushed",
		message: "Did you push it?",
		choices: getValues(BOOL_ANSWER)
	},
	chooseFile: {
		type: 'input',
		name: 'filename',
		message: "Which file?"
	},
	chooseBranch: {
		type: 'input',
		name: 'branchName',
		message: "Which branch?"
	},
};

const FUNCTIONS = {
	undoLocalCommit: function(args) {
		// console.log("undoLocalCommit");
		// console.log(JSON.stringify(args, null, " "));
		runGitCommand("reset --soft")
		.catch(e => {
			console.log("User canceled, aborting");
		})
	},
	undoPushedCommit: function(args) {
		// console.log("undoPushedCommit");
		// console.log(JSON.stringify(args, null, " "));
	},
	reverFileToBranch: function(args) {
		// console.log("reverFileToBranch");
		// console.log(JSON.stringify(args, null, ' '));
	}
}
const CONDITIONS_TREE = {
	questions: [QUESTIONS.task],
	nextSteps: {
		[TASKS.UNDO_COMMIT]: {
			questions: [QUESTIONS.isPushed],
			nextSteps: {
				[BOOL_ANSWER.TRUE]: FUNCTIONS.undoPushedCommit,
				[BOOL_ANSWER.FALSE]: FUNCTIONS.undoLocalCommit
			}
		},
		[TASKS.REVERT_FILE]: {
			questions: [QUESTIONS.chooseBranch, QUESTIONS.chooseFile]
		}
	}
}


function askQuestions(questionsTreeNode, results = {}) {
	return inquirer.prompt(questionsTreeNode.questions).then(answers => {
		results = Object.assign(results, answers);
		const answer = results[questionsTreeNode.questions[0].name];
		const nextStep = questionsTreeNode.nextSteps[answer];
		if(typeof nextStep === "function") {
			nextStep(results);
		} else {
			return askQuestions(nextStep, results);
		}
		
	});
}

function runGitCommand(command) {
	const commandParts = command.split(" ");
	console.log(" ")
	console.log("Going to run the following command: ")
	console.log(`git ${command}`);
	console.log(" ");

	return inquirer.prompt([{
		type: "list",
		name: "confirmation",
		message: "Ok?",
		choices: getValues(BOOL_ANSWER)
	}]).then(answers => {
		if(answers["confirmation"] === BOOL_ANSWER.TRUE) {
			return git.raw(command);
		} else {
			throw "USER_CANCELED"
		}
	})
}

function getValues(dict) {
	return Object.keys(dict).map(function(key) {
		return dict[key];
	});
}

askQuestions(CONDITIONS_TREE);