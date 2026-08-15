CREATE TABLE IF NOT EXISTS consultation_doctor_branch_association (
  id INT NOT NULL AUTO_INCREMENT,
  doctorUserId INT NOT NULL,
  branchId INT NOT NULL,
  createdBy INT NULL,
  updatedBy INT NULL,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_consultation_doctor_branch (doctorUserId, branchId),
  KEY idx_consultation_doctor_branch_branchId (branchId)
);

INSERT IGNORE INTO consultation_doctor_branch_association (
  doctorUserId,
  branchId,
  createdAt,
  updatedAt
)
SELECT
  cdm.userId,
  uba.branchId,
  NOW(),
  NOW()
FROM consultation_doctor_master cdm
INNER JOIN user_branch_association uba ON uba.userId = cdm.userId;
