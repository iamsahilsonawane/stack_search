const vscode = require("vscode");
const axios = require("axios");

async function activate(context) {
  let disposable = vscode.commands.registerCommand(
    "personal-links-manager.getQuestionsFromSO",
    async function () {
      vscode.window.showInformationMessage("Search for tags");
      var inputTag = await vscode.window.showInputBox({
        placeHolder: "Write comma-separated tags",
      });
      if (inputTag == "" || inputTag == null) {
        vscode.window.showInformationMessage("No tags provided");
        return;
      }
      const tags = inputTag.split(",");
      const soResponse = await axios.get(
        `https://api.stackexchange.com/2.3/questions?order=desc&sort=activity&tagged=${tags
          .map((tagStr) => tagStr.trim())
          .join(";")}&site=stackoverflow`
      );
      var questions = soResponse.data.items.map((question) => {
        return {
          label: question.title,
          detail: `By ${question.owner.display_name} | Answers: ${question.answer_count} | Views: ${question.view_count}`,
          link: question.link,
        };
      });

      var question = await vscode.window.showQuickPick(questions, {
        matchOnDetail: true,
      });

      if (question == null) {
        vscode.window.showInformationMessage("No question selected");
        return;
      }
      vscode.env.openExternal(question.link);
    }
  );

  context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
function deactivate() {}

module.exports = {
  activate,
  deactivate,
};
