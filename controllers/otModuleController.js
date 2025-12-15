const OTModuleService  = require('../services/otModuleService');
const Constants = require("../constants/constants");

class OTModuleController{
    constructor(request, response, next) {
        this._request = request;
        this._response = response;
        this._next = next;
        this._service = new OTModuleService(
          this._request,
          this._response,
          this._next
        );
      }

    async getAllPersonsListHandler(){
      const data = await this._service.getAllPersonsListService(this._request);
      this._response.status(200).send({
        status: 200,
        message: Constants.SUCCESS,
        data: data
      });
    }

    async getAllPersonsListDesignationWiseHandler(){
      const data = await this._service.getAllPersonsListDesignationWiseService(this._request);
      this._response.status(200).send({
        status: 200,
        message: Constants.SUCCESS,
        data: data
      });
    }
    
    async savePersonListHandler(){
        const data = await this._service.savePersonListService(this._request);
        this._response.status(200).send({
          status: 200,
          message: Constants.SUCCESS,
          data: data
        });
    }

    async editPersonDetailsHandler(){
      const data = await this._service.editPersonDetailsService(this._request);
      this._response.status(200).send({
        status: 200,
        message: Constants.SUCCESS,
        data: data
      });
    }

    async saveOtListHandler(){
      const data = await this._service.saveOtListService(this._request);
      this._response.status(200).send({
        status: 200,
        message: Constants.SUCCESS,
        data: data
      });
    }

    async getPersonSuggestionHandler(){
      const data = await this._service.getPersonSuggestionService(this._request);
      this._response.status(200).send({
        status: 200,
        message: Constants.SUCCESS,
        data: data
      });
    }

    async saveOtDetailsHandler(){
      const data = await this._service.saveOtDetailsService(this._request);
      this._response.status(200).send({
        status: 200,
        message: Constants.SUCCESS,
        data: data
      });
    }

    async getOtListHandler(){
      const data = await this._service.getOtListService(this._request);
      this._response.status(200).send({
        status: 200,
        message: Constants.SUCCESS,
        data: data
      });
    }

    async updateOtDetailsHandler(){
      const data = await this._service.editOtListService(this._request);
      this._response.status(200).send({
        status: 200,
        message: Constants.SUCCESS,
        data: data
      });
    }

    async getInjectionListHandler(){
      const data = await this._service.getInjectionListService(this._request);
      this._response.status(200).send({
        status: 200,
        message: Constants.SUCCESS,
        data: data
      });
    }

    async saveInjectionDetailsHandler(){
      const data = await this._service.saveInjectionListService(this._request);
      this._response.status(200).send({
        status: 200,
        message: Constants.SUCCESS,
        data: data
      });
    }

    async editInjectionDetailsHandler(){
      const data = await this._service.editInjectionListService(this._request);
      this._response.status(200).send({
        status: 200,
        message: Constants.SUCCESS,
        data: data
      });
    }

    async getInjectionSuggestionController(){
      const data = await this._service.getInjectionSuggestionList(this._request);
      this._response.status(200).send({
        status: 200,
        message: Constants.SUCCESS,
        data: data
      });
    }
}

module.exports = OTModuleController;