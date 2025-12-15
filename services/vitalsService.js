const MySqlConnection = require("../connections/mysql_connection");
const Constants = require("../constants/constants");
const createError = require("http-errors");
const VitalsAppointmentsAssociations = require('../models/Associations/vitalsAppointmentAssociations');
const {createVitalsSchema, editVitalsSchema} = require('../schemas/vitalsSchema')
const lodash = require("lodash");

class VitalsService{
    constructor(request, response, next) {
        this._request = request;
        this._response = response;
        this._next = next;
        this.mysqlConnection = MySqlConnection._instance;
    }

    async getVitalDetailsService(){
        const {appointmentId, type} = this._request.query;
        if(!appointmentId){
            throw new createError.BadRequest(
                Constants.PARAMS_ERROR.replace("{params}", "appointmentId")
              );
        }
        if(!type){
            throw new createError.BadRequest(
                Constants.PARAMS_ERROR.replace("{params}", "type")
              );
        }

        return await VitalsAppointmentsAssociations.findOne({
            where:{
                type: type,
                appointmentId: appointmentId
            }
        }).catch(err=>{
            console.log("Error while checking vitals present or not",err);
            throw new createError.InternalServerError(Constants.SOMETHING_ERROR_OCCURRED);
        });
    }

    async saveVitalsDetailsService(){
        const vitalsPayload = await createVitalsSchema.validateAsync(this._request.body);

        const {appointmentId, type} = vitalsPayload;

        const isExists = await VitalsAppointmentsAssociations.findOne({
            where:{
                type: type,
                appointmentId: appointmentId
            }
        }).catch(err=>{
            console.log("Error while checking vitals present or not",err);
            throw new createError.InternalServerError(Constants.SOMETHING_ERROR_OCCURRED);
        })

        if(!lodash.isEmpty(isExists)){
            throw new createError.BadRequest(Constants.VITALS_ALREADY_EXISTS)
        }

        await VitalsAppointmentsAssociations.create({
            ...vitalsPayload, 
            createdBy: this._request?.userDetails?.id
        }).catch(err=>{
            console.log("Error while saving vitals info",err);
            throw new createError.InternalServerError(Constants.SOMETHING_ERROR_OCCURRED);
        });

        return Constants.SUCCESS;
    }

    async editVitalsDetailsService(){
        const vitalsPayload = await editVitalsSchema.validateAsync(this._request.body);
        const {id} = vitalsPayload;
        const isExists = await VitalsAppointmentsAssociations.findOne({
            where:{
                id: id
            }
        }).catch(err=>{
            console.log("Error while checking vitals present or not",err);
            throw new createError.InternalServerError(Constants.SOMETHING_ERROR_OCCURRED);
        });

        if(lodash.isEmpty(isExists)){
            throw new createError.BadRequest(Constants.VITALS_DOESNOT_EXISTS);
        }
        delete vitalsPayload.id;

        await VitalsAppointmentsAssociations.update({
            ...vitalsPayload,
            createdBy: this._request?.userDetails?.id
        },{
            where:{
                id: id
            }
        }).catch(err =>{
            console.log("Error while updating the details",err);
            throw new createError.InternalServerError(Constants.SOMETHING_ERROR_OCCURRED);
        })

        return Constants.DATA_UPDATED_SUCCESS;
    }
}

module.exports = VitalsService;