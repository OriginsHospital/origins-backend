const Handlebars = require("handlebars");
const fs = require("fs");

class GenerateHtmlTemplate {
  constructor() {}

  getTemplateFromString = (templateStr, input) => {
    const template = Handlebars.compile(templateStr);
    let output = template(input);
    return output;
  };

  registerHelper(helperName, helperFunction) {
    Handlebars.registerHelper(helperName, helperFunction);
  }

  async generateTemplateFromFile(templateName, input) {
    if (templateName) {
      const filePath = `${process.cwd()}/templates/${templateName}`;

      const htmlContent = await this.readFileAsync(filePath).catch(err => {
        throw new Error(err.message);
      });
      return this.getTemplateFromString(htmlContent, input);
    } else {
      throw new Error("Template name can not be null");
    }
  }

  async generateTemplateFromText(templateText, input) {
    return this.getTemplateFromString(templateText, input);
  }

  readFileAsync(filePath) {
    return new Promise((resolve, reject) => {
      fs.readFile(filePath, "utf8", (err, content) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(content);
      });
    });
  }
}

module.exports = GenerateHtmlTemplate;
