const presrcibePurchaseInformationQuery = `
    select 
        (
        select
            JSON_OBJECT(
                'fullName', CONCAT(IFNULL(pm.lastName, ' '), ' ', IFNULL(pm.firstName, ' ')),
                'mobileNumber', pm.mobileNo,
                'aadhaarNumber', pm.aadhaarNo,
                'patientId', pm.patientId,
                'dob', pm.dateOfBirth,
                'photopath',pm.photoPath
            )
        from
            patient_master pm
        WHERE
            pm.id = pva.patientId) as patientDetails,
        caa.appointmentDate,
        TIME_FORMAT(caa.timeStart, '%H:%i') as timeStart ,
        TIME_FORMAT(caa.timeEnd, '%H:%i') as timeEnd ,
        (
        select
            cdm.name
        from
            consultation_doctor_master cdm
        where
            cdm.userId = caa.consultationDoctorId) as doctorName,
        'Consultation' as type,
        (
        select
            JSON_ARRAYAGG(
                JSON_OBJECT(
                    'itemName', (select im.itemName from stockmanagement.item_master im where im.id = calba.billTypeValue),
                    'purchaseQuantity', calba.purchaseQuantity ,
                    'prescribedQuantity', calba.prescribedQuantity
                ) 
            ) 
        ) as itemPurchaseDetails
        from
            consultation_appointment_line_bills_associations calba
        INNER JOIN consultation_appointments_associations caa on
            caa.id = calba.appointmentId
        INNER JOIN visit_consultations_associations vca on
            vca.id = caa.consultationId
        INNER JOIN patient_visits_association pva on
            pva.id = vca.visitId
        WHERE
            calba.billTypeId = 3
            and calba.status = 'PAID'
            and caa.appointmentDate = :appointmentDate
            and calba.purchaseQuantity < calba.prescribedQuantity 
        GROUP by
            calba.appointmentId
        UNION
        select 
            (
            select
                JSON_OBJECT(
                    'fullName', CONCAT(IFNULL(pm.lastName, ' '), ' ', IFNULL(pm.firstName, ' ')),
                    'mobileNumber', pm.mobileNo,
                    'aadhaarNumber', pm.aadhaarNo,
                    'patientId', pm.patientId,
                    'dob', pm.dateOfBirth,
                    'photopath',pm.photoPath
                )
            from
                patient_master pm
            WHERE
                pm.id = pva.patientId) as patientDetails,
            taa.appointmentDate,
            TIME_FORMAT(taa.timeStart, '%H:%i') as timeStart ,
            TIME_FORMAT(taa.timeEnd, '%H:%i') as timeEnd ,
            (
            select
                cdm.name
            from
                consultation_doctor_master cdm
            where
                cdm.userId = taa.consultationDoctorId) as doctorName,
            'Treatment' as type,
            (
            select
                JSON_ARRAYAGG(
                    JSON_OBJECT(
                        'itemName', (select im.itemName from stockmanagement.item_master im where im.id = talba.billTypeValue),
                        'purchaseQuantity', talba.purchaseQuantity ,
                        'prescribedQuantity', talba.prescribedQuantity
                    ) 
                ) 
            ) as itemPurchaseDetails
        from
            treatment_appointment_line_bills_associations talba 
        INNER JOIN treatment_appointments_associations taa  on
            taa.id = talba.appointmentId
        INNER JOIN visit_treatment_cycles_associations vtca on
            vtca.id = taa.treatmentCycleId
        INNER JOIN patient_visits_association pva on
            pva.id = vtca.visitId
        WHERE
            talba.billTypeId = 3
            and talba.status = 'PAID'
            and taa.appointmentDate = :appointmentDate
            and talba.purchaseQuantity < talba.prescribedQuantity 
        GROUP by
            talba.appointmentId
`;

module.exports = {
  presrcibePurchaseInformationQuery
};
