const vscode = require("vscode");
const axios = require("axios");

async function getSOSearch(term, type) {
  if (type == "title") {
    return await axios.get(
      `https://api.stackexchange.com/2.3/search/advanced?order=asc&sort=votes&title=${term}&site=stackoverflow`
    );
  }
  if (type == "query") {
    return await axios.get(
      `https://api.stackexchange.com/2.3/search/advanced?order=desc&sort=votes&q=${term}&site=stackoverflow`
    );
  }
}

function getQuestionsFromResponse(response) {
  var questions = response.data.items.map((question) => {
    return {
      label: question.title,
      detail: `By ${question.owner.display_name} | Answers: ${question.answer_count} | Views: ${question.view_count}`,
      link: question.link,
    };
  });
  return questions;
}

async function activate(context) {
  let soSearchDisposable = vscode.commands.registerCommand(
    "stack-search.getSearchResultsFromSO",
    async function () {
      vscode.window.showInformationMessage("Search the Question");
      var inputQuestion = await vscode.window.showInputBox({
        placeHolder: "Type your question here",
      });
      if (inputQuestion == "" || inputQuestion == null) {
        vscode.window.showInformationMessage("No Search Terms Provided");
        return;
      }
      var soResponse;
      var questions;
      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: "Fetching Questions",
        },
        async (_) => {
          console.log(_);
          soResponse = await getSOSearch(inputQuestion, "title");
          questions = getQuestionsFromResponse(soResponse);

          if (questions.length === 0) {
            soResponse = await getSOSearch(inputQuestion, "query");
            questions = getQuestionsFromResponse(soResponse);
          }
        }
      );
      if (questions.length === 0) {
        vscode.window.showInformationMessage(
          "No questions found for your search"
        );
        return;
      }

      var question = await vscode.window.showQuickPick(questions, {
        matchOnDetail: true,
      });

      if (question == null) {
        vscode.window.showInformationMessage("No Question Selected");
        return;
      }
      vscode.env.openExternal(question.link);
    }
  );

  let soQuestionsDisposable = vscode.commands.registerCommand(
    "stack-search.getQuestionsFromSO",
    async function () {
      var inputTag = await vscode.window.showInputBox({
        placeHolder: "Write comma-separated tags",
      });
      if (inputTag == "" || inputTag == null) {
        vscode.window.showInformationMessage("No tags provided");
        return;
      }
      const tags = inputTag.split(",");
      var soResponse;
      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: "Fetching Questions",
        },
        async (_) => {
          console.log(_);
          soResponse = await axios.get(
            `https://api.stackexchange.com/2.3/questions?order=desc&sort=activity&tagged=${tags
              .map((tagStr) => tagStr.trim())
              .join(";")}&site=stackoverflow`
          );
        }
      );
      var questions = soResponse.data.items.map((question) => {
        return {
          label: question.title,
          detail: `By ${question.owner.display_name} | Answers: ${question.answer_count} | Views: ${question.view_count}`,
          link: question.link,
        };
      });
      if (questions.length === 0) {
        vscode.window.showInformationMessage("No Questions Found for the Tags");
        return;
      }

      var question = await vscode.window.showQuickPick(questions, {
        matchOnDetail: true,
      });

      if (question == null) {
        vscode.window.showInformationMessage("No Question Selected");
        return;
      }
      vscode.env.openExternal(question.link);
    }
  );

  let soFavQuestionsDisposable = vscode.commands.registerCommand(
    "stack-search.getFavQuestionsFromSO",
    () => favQuestionHandler()
  );

  context.subscriptions.push(soSearchDisposable);
  context.subscriptions.push(soQuestionsDisposable);
  context.subscriptions.push(soFavQuestionsDisposable);
}

async function favQuestionHandler() {
  var favoriteTags = vscode.workspace
    .getConfiguration()
    .get("stackSearch.config.getFavoriteTags");

  const tags = favoriteTags.split(",");
  var soResponse;
  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: `Fetching Questions (Tags: ${favoriteTags})`,
    },
    async (_) => {
      console.log(_);
      soResponse = await axios.get(
        `https://api.stackexchange.com/2.3/questions?order=desc&sort=activity&tagged=${tags
          .map((tagStr) => tagStr.trim())
          .join(";")}&site=stackoverflow`
      );
    }
  );
  var questions = soResponse.data.items.map((question) => {
    return {
      label: question.title,
      detail: `By ${question.owner.display_name} | Answers: ${question.answer_count} | Views: ${question.view_count}`,
      link: question.link,
    };
  });
  if (questions.length === 0) {
    vscode.window.showInformationMessage("No questions found for the tags");
    return;
  }

  var question = await vscode.window.showQuickPick(questions, {
    matchOnDetail: true,
  });

  if (question == null) {
    vscode.window.showInformationMessage("No question selected");
    return;
  }
  vscode.env.openExternal(question.link);
}

// this method is called when your extension is deactivated
function deactivate() {}

module.exports = {
  activate,
  deactivate,
};
