-- Migration 016: Create materiButtonClick table for tracking button clicks
-- Purpose: Track student interactions with materi buttons for analytics
-- Date: 2025-12-29

CREATE TABLE IF NOT EXISTS materiButtonClick (
    idClick INT PRIMARY KEY AUTO_INCREMENT,
    idButton INT NOT NULL COMMENT 'FK to materiButton',
    idSiswa INT NOT NULL COMMENT 'FK to siswa',
    tanggalKlik TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'When the button was clicked',
    ipAddress VARCHAR(45) NULL COMMENT 'Optional: IP address of user',
    userAgent TEXT NULL COMMENT 'Optional: Browser user agent',
    
    -- Indexes for performance
    INDEX idx_button (idButton),
    INDEX idx_siswa (idSiswa),
    INDEX idx_tanggal (tanggalKlik),
    INDEX idx_button_siswa (idButton, idSiswa),
    
    -- Foreign keys
    CONSTRAINT fk_materiButtonClick_button 
        FOREIGN KEY (idButton) 
        REFERENCES materiButton(idButton) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE,
    
    CONSTRAINT fk_materiButtonClick_siswa 
        FOREIGN KEY (idSiswa) 
        REFERENCES siswa(idSiswa) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Verify table creation
DESCRIBE materiButtonClick;

-- Show indexes
SHOW INDEX FROM materiButtonClick;
