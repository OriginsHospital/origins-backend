const ConsentFormsTemplateService = require('../services/consentFormsTemplateService');
const Constants = require("../constants/constants");

class ConsentFormsTemplateController{
    constructor(request, response, next) {
        this._request = request;
        this._response = response;
        this._next = next;
        this._service = new ConsentFormsTemplateService(this._request, this._response, this._next);
    }

    async getConsentFormsListHandler(){
        const data = await this._service.getConsentFormsListService(this._request);
        this._response.status(200).send({
          status: 200,
          message: Constants.SUCCESS,
          data: data
        });
    }

    async downloadConsentFormByIdHandler(){
        await this._service.downloadConsentFormByIdService(this._request);
    }
}

module.exports = ConsentFormsTemplateController;