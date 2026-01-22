const ApiRoute = require("./api_route.js");
const AuthRoute = require("./auth_route");
const ManageRolesRoute = require("./roles_route");
const ManageBranchesRoute = require("./branches_route");
const ManageModulesRoute = require("./module_route");
const ManageUsersRoute = require("./users_route");
const ManagePatientsRoute = require("./patients_route");
const ManageVisitsRoute = require("./visits_route.js");
const ManageTimeSlotsRoute = require("./timeslots_route.js");
const ManageDoctorsRoute = require("./doctors_route.js");
const ManageAppointmentPaymentsRoute = require("./appointment_payments_routes.js");
const LabsRoute = require("./labs_route.js");
const ScanRoute = require("./scan_route");
const PharmacyRoute = require("./pharmacy_route.js");
const ReportsRoute = require("./reports_route");
const PaymentRoute = require("./payment_route");
const OTModuleRoute = require("./ot_module_route.js");
const ExpensesRoute = require("./expenses_route");
const EmbryologyRoute = require("./embryology_route.js");
const VitalsRoute = require("./vitals_route.js");
const TreatmentPaymentRoute = require("./treatment_payment_route.js");
const ConsentFormTemplatesRoute = require("./consent_forms_templates_route.js");
const IcsiRoute = require("./icsi_route.js");
const FetRoute = require("./fet_route.js");
const IuiRoute = require("./iui_route.js");
const CouponRoute = require("./coupon_route.js");
const PatientHistoryRoute = require("./patient_history_route.js");
const MasterDataRoute = require("./master_data_route.js");
const OrdersRoute = require("./orders_route.js");
const BaseRoute = require("./base_route.js");
const TaskTrackerRoute = require("./task_tracker_route.js");
const AlertsRoute = require("./alerts_route");
const ConsultantRoaster = require("./consultant_roaster_route.js");
const OtherPaymentsRoute = require("./other_payments_routes.js");
const IPRoute = require("./ip_route.js");
const TeamsRoute = require("./teams_route.js");
const TicketsRoute = require("./tickets_route.js");
const TasksRoute = require("./tasks_route.js");
const InboxRoute = require("./inbox_route.js");
const NotificationsRoute = require("./notifications_route.js");

class IndexRoute {
  constructor(expressApplication) {
    this._app = expressApplication;
  }

  async intializeRoutes() {
    this._app.use("/api", new ApiRoute()._route);
    this._app.use("/auth", new AuthRoute()._route);
    this._app.use("/roles", new ManageRolesRoute()._route);
    this._app.use("/branches", new ManageBranchesRoute()._route);
    this._app.use("/modules", new ManageModulesRoute()._route);
    this._app.use("/users", new ManageUsersRoute()._route);
    this._app.use("/patients", new ManagePatientsRoute()._route);
    this._app.use("/visits", new ManageVisitsRoute()._route);
    this._app.use("/slots", new ManageTimeSlotsRoute()._route);
    this._app.use("/doctors", new ManageDoctorsRoute()._route);
    this._app.use("/", new ManageAppointmentPaymentsRoute()._route);
    this._app.use("/labs", new LabsRoute()._route);
    this._app.use("/scan", new ScanRoute()._route);
    this._app.use("/pharmacy", new PharmacyRoute()._route);
    this._app.use("/reports", new ReportsRoute()._route);
    this._app.use("/payment", new PaymentRoute()._route);
    this._app.use("/op", new OTModuleRoute()._route);
    this._app.use("/expenses", new ExpensesRoute()._route);
    this._app.use("/embryology", new EmbryologyRoute()._route);
    this._app.use("/vitals", new VitalsRoute()._route);
    this._app.use("/treatmentPayment", new TreatmentPaymentRoute()._route);
    this._app.use(
      "/consentFormTemplate",
      new ConsentFormTemplatesRoute()._route
    );
    this._app.use("/icsi", new IcsiRoute()._route);
    this._app.use("/fet", new FetRoute()._route);
    this._app.use("/iui", new IuiRoute()._route);
    this._app.use("/coupon", new CouponRoute()._route);
    this._app.use("/patientHistory", new PatientHistoryRoute()._route);
    this._app.use("/masterData", new MasterDataRoute()._route);
    this._app.use("/orders", new OrdersRoute()._route);
    this._app.use("/base", new BaseRoute()._route);
    this._app.use("/taskTracker", new TaskTrackerRoute()._route);
    this._app.use("/alerts", new AlertsRoute()._route);
    this._app.use("/consultantRoaster", new ConsultantRoaster()._route);
    this._app.use("/otherPayments", new OtherPaymentsRoute()._route);
    this._app.use("/ip", new IPRoute()._route);
    this._app.use("/teams", new TeamsRoute()._route);
    this._app.use("/tickets", new TicketsRoute()._route);
    this._app.use("/tasks", new TasksRoute()._route);
    this._app.use("/inbox", new InboxRoute()._route);
    this._app.use("/notifications", new NotificationsRoute()._route);
  }
}

module.exports = IndexRoute;
