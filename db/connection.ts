import mysql from "mysql2/promise";
import type { RowDataPacket } from "mysql2/promise";

const globalForMysql = globalThis as unknown as {
  pool: mysql.Pool | undefined;
  initialized: boolean | undefined;
};

export const pool =
  globalForMysql.pool ??
  (process.env.MYSQL_URL || process.env.DATABASE_URL
    ? mysql.createPool(process.env.MYSQL_URL || process.env.DATABASE_URL!)
    : mysql.createPool({
        host: process.env.MYSQL_HOST || "localhost",
        port: Number(process.env.MYSQL_PORT) || 3306,
        user: process.env.MYSQL_USER || "root",
        password: process.env.MYSQL_PASSWORD || "",
        database: process.env.MYSQL_DATABASE || "tour_agency",
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
      }));

if (process.env.NODE_ENV !== "production") globalForMysql.pool = pool;

let initPromise: Promise<void> | null = null;

export async function DbConnect() {
  if (globalForMysql.initialized) return;

  if (!initPromise) {
    initPromise = (async () => {
      try {
        await pool.query(`
          CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            email VARCHAR(255) NOT NULL UNIQUE,
            password VARCHAR(255) NOT NULL,
            role ENUM('user', 'admin', 'tour_guide') NOT NULL DEFAULT 'user',
            profileImage VARCHAR(1000) DEFAULT '',
            profilePage VARCHAR(1000) DEFAULT '',
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);

        await pool.query(`
          CREATE TABLE IF NOT EXISTS tour_packages (
            id INT AUTO_INCREMENT PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            location VARCHAR(255) NOT NULL,
            duration VARCHAR(100) NOT NULL,
            priceBdt DECIMAL(12, 2) NOT NULL,
            rating DECIMAL(3, 1) DEFAULT 0.0,
            shortDescription TEXT NOT NULL,
            imageUrl VARCHAR(1000) NOT NULL,
            galleryUrls JSON,
            itinerary JSON,
            inclusions JSON,
            exclusions JSON,
            pickupInfo TEXT,
            cancellationPolicy TEXT,
            startDate DATETIME NULL,
            endDate DATETIME NULL,
            totalSeats INT DEFAULT 20,
            availableSeats INT DEFAULT 20,
            tourGuideId INT DEFAULT NULL,
            isActive BOOLEAN DEFAULT TRUE,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_isActive (isActive),
            FOREIGN KEY (tourGuideId) REFERENCES users(id) ON DELETE SET NULL
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);

        try {
          await pool.query("ALTER TABLE tour_packages ADD COLUMN startDate DATETIME NULL;");
        } catch {}
        try {
          await pool.query("ALTER TABLE tour_packages ADD COLUMN endDate DATETIME NULL;");
        } catch {}
        try {
          await pool.query("ALTER TABLE tour_packages ADD COLUMN totalSeats INT DEFAULT 20;");
        } catch {}
        try {
          await pool.query("ALTER TABLE tour_packages ADD COLUMN availableSeats INT DEFAULT 20;");
        } catch {}
        try {
          await pool.query("ALTER TABLE tour_packages ADD COLUMN tourGuideId INT DEFAULT NULL;");
        } catch {}

        await pool.query(`
          CREATE TABLE IF NOT EXISTS bookings (
            id INT AUTO_INCREMENT PRIMARY KEY,
            userId INT NOT NULL,
            packageId INT NOT NULL,
            travelDate DATETIME NOT NULL,
            travelers INT NOT NULL,
            contactPhone VARCHAR(50) NOT NULL,
            notes TEXT,
            travelerNames JSON,
            emergencyContact VARCHAR(255) DEFAULT '',
            status ENUM('pending', 'confirmed', 'cancelled', 'completed') DEFAULT 'pending',
            paymentStatus ENUM('unpaid', 'advance_due', 'advance_paid', 'paid', 'refunded') DEFAULT 'unpaid',
            paymentMethod VARCHAR(100) DEFAULT '',
            transactionId VARCHAR(255) DEFAULT '',
            adminNotes TEXT,
            attendanceStatus ENUM('unchecked', 'attending', 'not_coming') DEFAULT 'unchecked',
            totalPriceBdt DECIMAL(12, 2) NOT NULL,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_userId (userId),
            INDEX idx_packageId (packageId),
            INDEX idx_status (status),
            INDEX idx_paymentStatus (paymentStatus),
            FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (packageId) REFERENCES tour_packages(id) ON DELETE CASCADE
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);

        try {
          await pool.query("ALTER TABLE bookings ADD COLUMN attendanceStatus ENUM('unchecked', 'attending', 'not_coming') DEFAULT 'unchecked';");
        } catch {}

        await pool.query(`
          CREATE TABLE IF NOT EXISTS custom_trip_requests (
            id INT AUTO_INCREMENT PRIMARY KEY,
            destination VARCHAR(255) NOT NULL,
            additionalDestinations TEXT,
            tripType VARCHAR(100) NOT NULL,
            departureDate DATETIME NOT NULL,
            returnDate DATETIME NOT NULL,
            travelers INT NOT NULL,
            children INT DEFAULT 0,
            budget VARCHAR(100) NOT NULL,
            accommodation VARCHAR(255) DEFAULT '',
            name VARCHAR(255) NOT NULL,
            email VARCHAR(255) NOT NULL,
            phone VARCHAR(50) NOT NULL,
            notes TEXT,
            status ENUM('new', 'contacted', 'quoted', 'closed') DEFAULT 'new',
            adminNotes TEXT,
            userId INT DEFAULT NULL,
            tourGuideId INT DEFAULT NULL,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_status (status),
            INDEX idx_userId (userId),
            INDEX idx_tourGuideId (tourGuideId),
            FOREIGN KEY (userId) REFERENCES users(id) ON DELETE SET NULL,
            FOREIGN KEY (tourGuideId) REFERENCES users(id) ON DELETE SET NULL
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);

        try {
          const [uCols] = await pool.query<RowDataPacket[]>("SHOW COLUMNS FROM custom_trip_requests LIKE 'userId'");
          if (!uCols.length) {
            await pool.query("ALTER TABLE custom_trip_requests ADD COLUMN userId INT DEFAULT NULL;");
          }
          await pool.query("ALTER TABLE custom_trip_requests ADD CONSTRAINT fk_custom_trip_user FOREIGN KEY (userId) REFERENCES users(id) ON DELETE SET NULL;");
        } catch {}

        try {
          const [gCols] = await pool.query<RowDataPacket[]>("SHOW COLUMNS FROM custom_trip_requests LIKE 'tourGuideId'");
          if (!gCols.length) {
            await pool.query("ALTER TABLE custom_trip_requests ADD COLUMN tourGuideId INT DEFAULT NULL;");
          }
          await pool.query("ALTER TABLE custom_trip_requests ADD CONSTRAINT fk_custom_trip_guide FOREIGN KEY (tourGuideId) REFERENCES users(id) ON DELETE SET NULL;");
        } catch {}

        await pool.query(`
          CREATE TABLE IF NOT EXISTS reviews (
            id INT AUTO_INCREMENT PRIMARY KEY,
            userId INT NOT NULL,
            packageId INT NOT NULL,
            bookingId INT NOT NULL UNIQUE,
            rating INT NOT NULL,
            comment TEXT NOT NULL,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_userId (userId),
            INDEX idx_packageId (packageId),
            FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (packageId) REFERENCES tour_packages(id) ON DELETE CASCADE,
            FOREIGN KEY (bookingId) REFERENCES bookings(id) ON DELETE CASCADE
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);

        await pool.query(`
          CREATE TABLE IF NOT EXISTS payments (
            id INT AUTO_INCREMENT PRIMARY KEY,
            bookingId INT NOT NULL,
            userId INT NOT NULL,
            amountBdt DECIMAL(12, 2) NOT NULL,
            paymentMethod VARCHAR(100) NOT NULL,
            transactionId VARCHAR(255) NOT NULL,
            status ENUM('pending', 'completed', 'failed', 'refunded') NOT NULL DEFAULT 'pending',
            notes TEXT,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_bookingId (bookingId),
            INDEX idx_userId (userId),
            INDEX idx_status (status),
            FOREIGN KEY (bookingId) REFERENCES bookings(id) ON DELETE CASCADE,
            FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);

        await pool.query(`
          CREATE TABLE IF NOT EXISTS support_threads (
            id VARCHAR(100) PRIMARY KEY,
            userId INT NOT NULL,
            subject VARCHAR(255) NOT NULL DEFAULT 'General Inquiry',
            status ENUM('open', 'closed') DEFAULT 'open',
            isReadByAdmin BOOLEAN DEFAULT FALSE,
            isReadByUser BOOLEAN DEFAULT FALSE,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_userId (userId),
            INDEX idx_status (status),
            FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);

        await pool.query(`
          CREATE TABLE IF NOT EXISTS support_messages (
            id INT AUTO_INCREMENT PRIMARY KEY,
            threadId VARCHAR(100) NOT NULL,
            userId INT NOT NULL,
            senderRole ENUM('user', 'admin') NOT NULL DEFAULT 'user',
            name VARCHAR(255) NOT NULL,
            email VARCHAR(255) NOT NULL,
            phone VARCHAR(50) DEFAULT '',
            subject VARCHAR(255) DEFAULT 'General Inquiry',
            message TEXT NOT NULL,
            isReadByAdmin BOOLEAN DEFAULT FALSE,
            isReadByUser BOOLEAN DEFAULT FALSE,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_threadId (threadId),
            INDEX idx_userId (userId),
            FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);

        await pool.query(`
          CREATE TABLE IF NOT EXISTS wishlists (
            id INT AUTO_INCREMENT PRIMARY KEY,
            userId INT NOT NULL,
            packageId INT NOT NULL,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY idx_user_package (userId, packageId),
            INDEX idx_userId (userId),
            FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (packageId) REFERENCES tour_packages(id) ON DELETE CASCADE
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);

        await pool.query(`
          CREATE TABLE IF NOT EXISTS trip_announcements (
            id INT AUTO_INCREMENT PRIMARY KEY,
            packageId INT NOT NULL,
            guideId INT NOT NULL,
            title VARCHAR(255) NOT NULL,
            message TEXT NOT NULL,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_packageId (packageId),
            FOREIGN KEY (packageId) REFERENCES tour_packages(id) ON DELETE CASCADE,
            FOREIGN KEY (guideId) REFERENCES users(id) ON DELETE CASCADE
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);

        // Migration: ensure role column ENUM includes 'tour_guide'
        try {
          await pool.query(`
            ALTER TABLE users MODIFY COLUMN role ENUM('user', 'admin', 'tour_guide') NOT NULL DEFAULT 'user'
          `);
        } catch (err) {
          // Log migration error if any
          console.log("Migration notice for users.role ENUM:", err);
        }

        globalForMysql.initialized = true;
      } catch (err) {
        console.error("MySQL table setup error:", err);
      }
    })();
  }

  await initPromise;
}
