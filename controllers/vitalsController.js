const VitalsService = require("../services/vitalsService");
const Constants = require("../constants/constants");

class VitalsController{
    constructor(request, response, next) {
        this._request = request;
        this._response = response;
        this._next = next;
        this._service = new VitalsService(
          this._request,
          this._response,
          this._next
        );
    }

    async getVitalDetailsHandler(){
        const data = await this._service.getVitalDetailsService(this._request);
        this._response.status(200).send({
          status: 200,
          message: Constants.SUCCESS,
          data: data
        });
    }

    async saveVitalsHandler(){
        const data = await this._service.saveVitalsDetailsService(this._request);
        this._response.status(200).send({
          status: 200,
          message: Constants.SUCCESS,
          data: data
        });
    }

    async editVitalsHandler(){
        const data = await this._service.editVitalsDetailsService(this._request);
        this._response.status(200).send({
          status: 200,
          message: Constants.SUCCESS,
          data: data
        });
    }
}

module.exports = VitalsController;