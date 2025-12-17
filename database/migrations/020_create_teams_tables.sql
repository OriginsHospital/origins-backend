-- Teams Module Database Tables
-- Migration: 020_create_teams_tables.sql

-- ============ TEAM CHATS TABLE ============
CREATE TABLE IF NOT EXISTS `team_chats` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) NULL DEFAULT NULL,
  `description` TEXT NULL DEFAULT NULL,
  `chatType` ENUM('direct', 'group') NOT NULL DEFAULT 'direct',
  `createdBy` INT(11) NOT NULL,
  `updatedBy` INT(11) NULL DEFAULT NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_createdBy` (`createdBy`),
  INDEX `idx_chatType` (`chatType`),
  INDEX `idx_updatedAt` (`updatedAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============ TEAM CHAT MEMBERS TABLE ============
CREATE TABLE IF NOT EXISTS `team_chat_members` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `chatId` INT(11) NOT NULL,
  `userId` INT(11) NOT NULL,
  `role` ENUM('admin', 'member') NOT NULL DEFAULT 'member',
  `joinedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `lastReadAt` DATETIME NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_chat_user` (`chatId`, `userId`),
  INDEX `idx_chatId` (`chatId`),
  INDEX `idx_userId` (`userId`),
  CONSTRAINT `fk_chat_member_chat` FOREIGN KEY (`chatId`) REFERENCES `team_chats` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_chat_member_user` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============ TEAM MESSAGES TABLE ============
CREATE TABLE IF NOT EXISTS `team_messages` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `chatId` INT(11) NOT NULL,
  `senderId` INT(11) NOT NULL,
  `message` TEXT NULL DEFAULT NULL,
  `messageType` ENUM('text', 'file', 'image', 'video', 'audio') NOT NULL DEFAULT 'text',
  `fileUrl` VARCHAR(500) NULL DEFAULT NULL,
  `fileName` VARCHAR(255) NULL DEFAULT NULL,
  `fileSize` INT(11) NULL DEFAULT NULL,
  `replyToMessageId` INT(11) NULL DEFAULT NULL,
  `mentions` JSON NULL DEFAULT NULL,
  `isEdited` BOOLEAN NOT NULL DEFAULT FALSE,
  `isDeleted` BOOLEAN NOT NULL DEFAULT FALSE,
  `deletedAt` DATETIME NULL DEFAULT NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_chatId_createdAt` (`chatId`, `createdAt`),
  INDEX `idx_senderId` (`senderId`),
  INDEX `idx_replyToMessageId` (`replyToMessageId`),
  CONSTRAINT `fk_message_chat` FOREIGN KEY (`chatId`) REFERENCES `team_chats` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_message_sender` FOREIGN KEY (`senderId`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_message_reply` FOREIGN KEY (`replyToMessageId`) REFERENCES `team_messages` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============ TEAM MEETINGS TABLE ============
CREATE TABLE IF NOT EXISTS `team_meetings` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT NULL DEFAULT NULL,
  `startTime` DATETIME NOT NULL,
  `endTime` DATETIME NULL DEFAULT NULL,
  `agenda` TEXT NULL DEFAULT NULL,
  `location` VARCHAR(255) NULL DEFAULT NULL,
  `meetingType` ENUM('scheduled', 'instant', 'recurring') NOT NULL DEFAULT 'scheduled',
  `meetingLink` VARCHAR(500) NULL DEFAULT NULL,
  `status` ENUM('scheduled', 'ongoing', 'completed', 'cancelled') NOT NULL DEFAULT 'scheduled',
  `createdBy` INT(11) NOT NULL,
  `updatedBy` INT(11) NULL DEFAULT NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_startTime` (`startTime`),
  INDEX `idx_status` (`status`),
  INDEX `idx_createdBy` (`createdBy`),
  CONSTRAINT `fk_meeting_creator` FOREIGN KEY (`createdBy`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_meeting_updater` FOREIGN KEY (`updatedBy`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============ TEAM MEETING PARTICIPANTS TABLE ============
CREATE TABLE IF NOT EXISTS `team_meeting_participants` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `meetingId` INT(11) NOT NULL,
  `userId` INT(11) NOT NULL,
  `status` ENUM('invited', 'accepted', 'declined', 'attended', 'absent') NOT NULL DEFAULT 'invited',
  `joinedAt` DATETIME NULL DEFAULT NULL,
  `leftAt` DATETIME NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_meeting_user` (`meetingId`, `userId`),
  INDEX `idx_meetingId` (`meetingId`),
  INDEX `idx_userId` (`userId`),
  CONSTRAINT `fk_participant_meeting` FOREIGN KEY (`meetingId`) REFERENCES `team_meetings` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_participant_user` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============ TEAM CALENDAR EVENTS TABLE ============
CREATE TABLE IF NOT EXISTS `team_calendar_events` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT NULL DEFAULT NULL,
  `eventType` ENUM('meeting', 'task', 'reminder', 'shift', 'appointment') NOT NULL DEFAULT 'meeting',
  `startTime` DATETIME NOT NULL,
  `endTime` DATETIME NULL DEFAULT NULL,
  `location` VARCHAR(255) NULL DEFAULT NULL,
  `priority` ENUM('low', 'medium', 'high', 'urgent') NOT NULL DEFAULT 'medium',
  `color` VARCHAR(7) NULL DEFAULT '#1976d2',
  `isAllDay` BOOLEAN NOT NULL DEFAULT FALSE,
  `createdBy` INT(11) NOT NULL,
  `updatedBy` INT(11) NULL DEFAULT NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_startTime_endTime` (`startTime`, `endTime`),
  INDEX `idx_eventType` (`eventType`),
  INDEX `idx_createdBy` (`createdBy`),
  CONSTRAINT `fk_event_creator` FOREIGN KEY (`createdBy`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_event_updater` FOREIGN KEY (`updatedBy`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============ TEAM SCHEDULES TABLE ============
CREATE TABLE IF NOT EXISTS `team_schedules` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT NULL DEFAULT NULL,
  `scheduleType` ENUM('shift', 'task', 'rotation') NOT NULL DEFAULT 'shift',
  `startTime` DATETIME NOT NULL,
  `endTime` DATETIME NOT NULL,
  `assignedTo` INT(11) NULL DEFAULT NULL,
  `departmentId` INT(11) NULL DEFAULT NULL,
  `priority` ENUM('low', 'medium', 'high', 'urgent') NOT NULL DEFAULT 'medium',
  `status` ENUM('pending', 'in-progress', 'completed', 'cancelled') NOT NULL DEFAULT 'pending',
  `createdBy` INT(11) NOT NULL,
  `updatedBy` INT(11) NULL DEFAULT NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_startTime_endTime` (`startTime`, `endTime`),
  INDEX `idx_assignedTo` (`assignedTo`),
  INDEX `idx_scheduleType` (`scheduleType`),
  INDEX `idx_createdBy` (`createdBy`),
  CONSTRAINT `fk_schedule_assigned` FOREIGN KEY (`assignedTo`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_schedule_creator` FOREIGN KEY (`createdBy`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_schedule_updater` FOREIGN KEY (`updatedBy`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============ TEAM CALLS TABLE ============
CREATE TABLE IF NOT EXISTS `team_calls` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `chatId` INT(11) NULL DEFAULT NULL,
  `callerId` INT(11) NOT NULL,
  `receiverId` INT(11) NOT NULL,
  `callType` ENUM('voice', 'video') NOT NULL DEFAULT 'voice',
  `callStatus` ENUM('initiated', 'ringing', 'answered', 'rejected', 'missed', 'ended', 'failed') NOT NULL DEFAULT 'initiated',
  `startTime` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `endTime` DATETIME NULL DEFAULT NULL,
  `duration` INT(11) NULL DEFAULT NULL COMMENT 'Duration in seconds',
  PRIMARY KEY (`id`),
  INDEX `idx_callerId_createdAt` (`callerId`, `startTime`),
  INDEX `idx_receiverId_createdAt` (`receiverId`, `startTime`),
  INDEX `idx_callStatus` (`callStatus`),
  INDEX `idx_chatId` (`chatId`),
  CONSTRAINT `fk_call_chat` FOREIGN KEY (`chatId`) REFERENCES `team_chats` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_call_caller` FOREIGN KEY (`callerId`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_call_receiver` FOREIGN KEY (`receiverId`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

