CREATE TABLE role_master(
	id int auto_increment,
	name varchar(100) not null,
	createdAt datetime,
	updatedAt datetime,
	primary key(id)
)COMMENT 'Table to store all available role names';

CREATE TABLE module_master(
	id int auto_increment,
	name varchar(100) not null,
	createdAt datetime,
	updatedAt datetime,
	primary key(id)
)COMMENT 'Table to store all available module names';

CREATE TABLE role_module_associations(
	id int auto_increment, 
	roleId int,
	moduleId int,
	createdAt datetime,
	updatedAt datetime,
	foreign key(roleId) references role_master(id),
	foreign key(moduleId) references module_master(id),
	primary key(id)
)COMMENT 'Table to store module associated with each role type';

CREATE TABLE users(
	id int auto_increment,
	fullName varchar(100) not null,
	email varchar(100) not null,
	password varchar(200) not null,
	roleId int not null,
	userName varchar(100) not null,
	isAdminVerified boolean not null,
	isEmailVerified boolean not null,
	createdAt datetime,
	updatedAt datetime,
	primary key(id),
	foreign key(roleId) references role_master(id)
)COMMENT 'Table to store the users and their role information';

CREATE TABLE branch_master(
	id int auto_increment,
	name varchar(100) not null,
	branchCode varchar(3) not null,
	createdAt datetime,
	updatedAt datetime,
	primary key(id)
);


CREATE TABLE user_branch_association(
	id int auto_increment,
	userId int not null,
	branchId int not null,
	createdAt datetime,
	updatedAt datetime,
	foreign key(userId) references users(id),
	foreign key(branchId) references branch_master(id),
	primary key(id)
);


create table user_module_associations(
	id int not null,
	userId int not null,
	moduleId int not null,
	accessType varchar(1) not null,
	createdAt datetime,
	updatedAt datetime,
	foreign key(userId) references users(id),
	foreign key(moduleId) references module_master(id),
	primary key(id)
)

CREATE TABLE state_master (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100),
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE city_master (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100),
    stateId INT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (stateId) REFERENCES state_master(id)
);

CREATE TABLE referral_type_master (
	id INTEGER AUTO_INCREMENT,
	name VARCHAR(50) NULL,
	createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    	updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	primary key(id)
)

CREATE TABLE patient_master (
   id INT AUTO_INCREMENT PRIMARY KEY,
    patientId VARCHAR(100),
    branchId int not null,
    aadhaarNo VARCHAR(12) UNIQUE,
    mobileNo VARCHAR(10),
    firstName VARCHAR(50),
    lastName VARCHAR(50),
    gender ENUM('Male', 'Female', 'Other'),
    maritalStatus VARCHAR(50),
    dateOfBirth DATE,
    addressLine1 VARCHAR(255),
    addressLine2 VARCHAR(255),
    cityId INT,
    stateId INT,
    referralId INT,
    pincode VARCHAR(6),
    photoPath VARCHAR(255),
    FOREIGN KEY (branchId) REFERENCES branch_master(id),
    FOREIGN KEY (stateId) REFERENCES state_master(id),
    FOREIGN KEY (cityId) REFERENCES city_master(id),
    FOREIGN KEY (referralId) REFERENCES referral_type_master(id)
);


CREATE TABLE patient_visits_association (
    id INT AUTO_INCREMENT PRIMARY KEY,
    patientId INT,
    FOREIGN KEY (patientId) REFERENCES patient_master(id),
    type INT,
    FOREIGN KEY(type) REFERENCES visit_type_master(id),
    isActive TINYINT(1),
    visitDate DATETIME,
    packageChosen INT,
    FOREIGN KEY(packageChosen) REFERENCES package_master(id),
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);


CREATE TABLE visit_documents_associations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    visitId INT,
    documentPath VARCHAR(255),
    FOREIGN KEY (visitId) REFERENCES patient_visits_association(id),
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP 
);

CREATE TABLE visit_treatments_associations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    visitId INT,
    FOREIGN KEY (visitId) REFERENCES patient_visits_association(id),
    type VARCHAR(100),
    appointmentDate date not null,
    timeStart TIME not null,
    timeEnd TIME not null,
    consultationDoctorId INT,
    amount DECIMAL(10, 2),
    lineBillAmount DECIMAL(10, 2),
    isSeen TINYINT(1),
    seenAt DATETIME,
    isArrived TINYINT(1),
    arrivedAt DATETIME,
    isDone TINYINT(1),
    doneAt DATETIME,
    createdBy INT,
    updatedBy INT,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE treatment_payments_associations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    treatment_id INT,
    FOREIGN KEY (treatment_id) REFERENCES visit_treatments_associations(id),
    totalAmount DECIMAL(10, 2),
    totalLineBillAmounts DECIMAL(10, 2),
    amountPaid DECIMAL(10, 2),
    pendingAmount DECIMAL(10, 2),
    paymentMode VARCHAR(255),
    createdBy INT,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedBy INT,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE treatment_logs_associations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    treatment_id INT,
    FOREIGN KEY (treatment_id) REFERENCES visit_treatments_associations(id),
    log LONGTEXT,
    createdBy INT,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedBy INT,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE treatment_vitals_associations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    treatment_id INT,
    FOREIGN KEY (treatment_id) REFERENCES visit_treatments_associations(id),
    weight DECIMAL(5,2),
    height DECIMAL(5,2),
    temperature DECIMAL(5,2),
    pulseRate INT,
    systolic_BP INT,
    diastolic_BP INT,
    createdBy INT,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedBy INT,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE patient_guardian_associations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    patientId INT,
    FOREIGN KEY (patientId) REFERENCES patient_master(id),
    name VARCHAR(255),
    age INT,
    gender VARCHAR(10),
    relation VARCHAR(50),
    additionalDetails TEXT,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE blocked_slots_master (
	id int auto_increment,
	doctorId int not null,
	blockedDate date not null,
	timeStart TIME not null,
	timeEnd TIME not null,
	blockType varchar(1) DEFAULT 'B',
	createdAt datetime,
	updatedAt datetime,
	foreign key (doctorId) references users(id),
	primary key (id)
);

CREATE Table visit_type_master (
  "id" int NOT NULL AUTO_INCREMENT,
  "name" varchar(255) NOT NULL,
  "createdAt" datetime DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  PRIMARY KEY ("id")
);

CREATE Table package_master (
  id int NOT NULL AUTO_INCREMENT,
  name varchar(255) NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);

CREATE Table consultancy_doctor_master (
  id int NOT NULL AUTO_INCREMENT,
  userId int NOT NULL,
  name varchar(255) NOT NULL,
  shiftFrom TIME NOT NULL,
  shiftTo TIME NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  FOREIGN KEY(userId) REFERENCES users(id)
);


CREATE TABLE visit_consultations_associations (
    id INT NOT NULL AUTO_INCREMENT,
    visitId INT,
    type VARCHAR(255),
    createdBy INT,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    FOREIGN KEY(visitId) REFERENCES patient_visits_association(id)
);

CREATE TABLE consultation_appointments_associations (
    id INT NOT NULL AUTO_INCREMENT,
    consultationId INT,
    appointmentDate DATE,
    consultationDoctorId INT,
    timeStart TIME,
    timeEnd TIME,
    createdBy INT,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    FOREIGN KEY (consultationId) REFERENCES visit_consultations_associations (id),
    FOREIGN KEY (consultationDoctorId) REFERENCES consultancy_doctor_master(id)
);

CREATE TABLE visit_treatment_cycles_associations (
    id INT NOT NULL AUTO_INCREMENT,
    visitId INT,
    type VARCHAR(255),
    createdBy INT,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    FOREIGN KEY (visitId) REFERENCES patient_visits_association (id)
);

CREATE TABLE treatment_cycle_appointments_associations (
    id INT NOT NULL AUTO_INCREMENT,
    treatmentCycleId INT,
    appointmentDate DATE,
    consultationDoctorId INT,
    timeStart TIME,
    timeEnd TIME,
    createdBy INT,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    FOREIGN KEY (treatmentCycleId) REFERENCES visit_treatment_cycles_associations (id)
);

CREATE TABLE appointment_linebills_associations (
    id INT NOT NULL AUTO_INCREMENT,
    appointmentId INT,
    billType VARCHAR(255),
    billReason VARCHAR(255),
    amount DECIMAL(10, 2),
    createdBy INT,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);

CREATE TABLE appointment_logs_associations (
    id INT NOT NULL AUTO_INCREMENT,
    appointmentId INT,
    logs LONGTEXT,
    createdBy INT,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);

CREATE TABLE visit_payments_associations (
    id INT NOT NULL AUTO_INCREMENT,
    visitId INT,
    amount DECIMAL(10, 2),
    paymentMode VARCHAR(255),
    createdBy INT,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    FOREIGN KEY (visitId) REFERENCES patient_visits_association (id)
);

CREATE TABLE consultation_appointment_labtests_associations(
	id INT PRIMARY KEY AUTO_INCREMENT,
	appointmentId INT NOT NULL,
	labTests LONGTEXT NOT NULL,
	isDone TINYINT DEFAULT 0,
	CreatedBy INT NOT NULL,
	createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
	updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	FOREIGN KEY(appointmentId) REFERENCES consultation_appointments_associations(id)
)

CREATE TABLE treatment_appointment_labtests_associations(
	id INT PRIMARY KEY AUTO_INCREMENT,
	appointmentId INT NOT NULL,
	labTests LONGTEXT NOT NULL,
	isDone TINYINT DEFAULT 0,
	CreatedBy INT NOT NULL,
	createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
	updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	FOREIGN KEY(appointmentId) REFERENCES treatment_appointments_associations(id)
)


CREATE TABLE consultation_appointment_pharmacy_associations(
	id INT PRIMARY KEY AUTO_INCREMENT,
	appointmentId INT NOT NULL,
	medicinesList LONGTEXT NOT NULL,
	isDone TINYINT DEFAULT 0,
	CreatedBy INT NOT NULL,
	createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
	updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	FOREIGN KEY(appointmentId) REFERENCES consultation_appointments_associations(id)
)

CREATE TABLE treatment_appointment_pharmacy_associations(
	id INT PRIMARY KEY AUTO_INCREMENT,
	appointmentId INT NOT NULL,
	medicinesList LONGTEXT NOT NULL,
	isDone TINYINT DEFAULT 0,
	CreatedBy INT NOT NULL,
	createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
	updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	FOREIGN KEY(appointmentId) REFERENCES treatment_appointments_associations(id)
)

CREATE TABLE consultation_appointment_notes_associations(
	id INT PRIMARY KEY AUTO_INCREMENT,
	appointmentId INT NOT NULL,
	notes LONGTEXT NOT NULL,
	CreatedBy INT NOT NULL,
	createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
	updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	FOREIGN KEY(appointmentId) REFERENCES consultation_appointments_associations(id)
)

CREATE TABLE treatment_appointment_notes_associations(
	id INT PRIMARY KEY AUTO_INCREMENT,
	appointmentId INT NOT NULL,
	notes LONGTEXT NOT NULL,
	isDone TINYINT DEFAULT 0,
	CreatedBy INT NOT NULL,
	createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
	updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	FOREIGN KEY(appointmentId) REFERENCES treatment_appointments_associations(id)
)

CREATE TABLE line_bills_master (
    id INT PRIMARY KEY AUTO_INCREMENT,
    billType VARCHAR(255) NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE consultation_appointment_line_bills_associations (
    id INT NOT NULL AUTO_INCREMENT,
    appointmentId INT NOT NULL,
    billTypeId INT NOT NULL,
    billTypeValue INT NOT NULL,
    createdBy INT NOT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    FOREIGN KEY (appointmentId) REFERENCES appointments(id),
    FOREIGN KEY (billTypeId) REFERENCES line_bills_master(id),
    FOREIGN KEY (createdBy) REFERENCES users(id)
);

 CREATE TABLE treatment_appointment_line_bills_associations (
    id INT NOT NULL AUTO_INCREMENT,
    appointmentId INT NOT NULL,
    billTypeId INT NOT NULL,
    billTypeValue INT NOT NULL,
    createdBy INT NOT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    FOREIGN KEY (appointmentId) REFERENCES treatment_appointments_associations(id),
    FOREIGN KEY (billTypeId) REFERENCES line_bills_master(id),
    FOREIGN KEY (createdBy) REFERENCES users(id)
);

CREATE TABLE tax_category_master (
    id INT AUTO_INCREMENT PRIMARY KEY,
    categoryName VARCHAR(100) NOT NULL,
    taxPercent DECIMAL(10, 2) NOT NULL,
    createdBy INT NOT NULL,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (createdBy) REFERENCES defaultdb.users(id)
);

CREATE TABLE inventory_type_master (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    createdBy INT NOT NULL,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (createdBy) REFERENCES defaultdb.users(id)
);

CREATE TABLE manufacturer_master (
    id INT AUTO_INCREMENT PRIMARY KEY,
    manufacturer VARCHAR(255) NOT NULL,
    contactPerson VARCHAR(255) NOT NULL,
    contactNumber VARCHAR(20) NOT NULL,
    pincode VARCHAR(10),
    fax VARCHAR(20),
    address TEXT,
    alternateContact VARCHAR(20),
    emailId VARCHAR(100),
    website VARCHAR(100),
    remarks TEXT,
    apgstNumber VARCHAR(50),
    cstNumber VARCHAR(50),
    tinNumber VARCHAR(50),
    dlNumber VARCHAR(50),
    panNumber VARCHAR(50),
    isActive BOOLEAN NOT NULL DEFAULT FALSE,
    createdBy INT NOT NULL,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (createdBy) REFERENCES defaultdb.users(id)
);

CREATE TABLE supplier_master (
    id INT AUTO_INCREMENT PRIMARY KEY,
    supplier VARCHAR(255) NOT NULL,
    gstNumber VARCHAR(50) NOT NULL,
    contactPerson VARCHAR(255) NOT NULL,
    contactNumber VARCHAR(20) NOT NULL,
    emailId VARCHAR(100),
    tinNumber VARCHAR(50),
    panNumber VARCHAR(50),
    dlNumber VARCHAR(50),
    address TEXT,
    accountDetails TEXT,
    remarks TEXT,
    isActive BOOLEAN NOT NULL DEFAULT FALSE,
    createdBy INT NOT NULL,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (createdBy) REFERENCES defaultdb.users(id)
);

CREATE TABLE item_master (
    id INT AUTO_INCREMENT PRIMARY KEY,
    itemName VARCHAR(255) NOT NULL,
    inventoryType INT NOT NULL,
    manufacturerName INT NOT NULL,
    hsnCode VARCHAR(50),
    categoryName VARCHAR(100),
    taxCategory INT NOT NULL,
    isActive BOOLEAN NOT NULL DEFAULT FALSE,
    createdBy INT NOT NULL,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (inventoryType) REFERENCES inventory_type_master(id),
    FOREIGN KEY (manufacturerName) REFERENCES manufacturer_master(id),
    FOREIGN KEY (taxCategory) REFERENCES tax_category_master(id),
    FOREIGN KEY (createdBy) REFERENCES defaultdb.users(id)
);