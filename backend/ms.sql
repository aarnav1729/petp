-- 1. Vendor Table
CREATE TABLE Vendor (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    Username NVARCHAR(255) NOT NULL UNIQUE,
    VendorName NVARCHAR(255) NOT NULL UNIQUE,
    Password NVARCHAR(255),
    Email NVARCHAR(255) NOT NULL UNIQUE,
    ContactNumber NVARCHAR(50) NOT NULL UNIQUE
);

-- 2. RFQ Table
CREATE TABLE RFQ (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    RFQNumber NVARCHAR(50),
    ShortName NVARCHAR(255),
    CompanyType NVARCHAR(255),
    SapOrder NVARCHAR(255),
    ItemType NVARCHAR(255),
    CustomerName NVARCHAR(255),
    OriginLocation NVARCHAR(255),
    DropLocationState NVARCHAR(255),
    DropLocationDistrict NVARCHAR(255),
    Address NVARCHAR(MAX) NOT NULL,
    Pincode NVARCHAR(6) NOT NULL,
    VehicleType NVARCHAR(255),
    AdditionalVehicleDetails NVARCHAR(MAX),
    NumberOfVehicles INT,
    Weight NVARCHAR(255),
    BudgetedPriceBySalesDept DECIMAL(18, 2),
    MaxAllowablePrice DECIMAL(18, 2),
    eReverseDate DATETIME NULL,
    eReverseTime NVARCHAR(50) NULL,
    VehiclePlacementBeginDate DATETIME,
    VehiclePlacementEndDate DATETIME,
    Status NVARCHAR(50) DEFAULT 'initial',
    InitialQuoteEndTime DATETIME NOT NULL,
    EvaluationEndTime DATETIME NOT NULL,
    FinalizeReason NVARCHAR(MAX),
    l1Price DECIMAL(18, 2),
    l1VendorId UNIQUEIDENTIFIER NULL,
    RFQClosingDate DATETIME,
    RFQClosingTime NVARCHAR(50) NOT NULL,
    eReverseToggle BIT DEFAULT 0,
    rfqType NVARCHAR(50) DEFAULT 'D2D',
    CreatedAt DATETIME NOT NULL DEFAULT GETDATE(),
    UpdatedAt DATETIME NOT NULL DEFAULT GETDATE(),
    CONSTRAINT chk_RFQ_Status CHECK (Status IN ('initial', 'evaluation', 'closed')),
    CONSTRAINT chk_RFQ_rfqType CHECK (rfqType IN ('Long Term', 'D2D')),
    CONSTRAINT chk_RFQ_Pincode CHECK (Pincode LIKE '[0-9][0-9][0-9][0-9][0-9][0-9]'),
    FOREIGN KEY (l1VendorId) REFERENCES Vendor(Id)
);

-- 3. User Table
CREATE TABLE [User] (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    Username NVARCHAR(255) NOT NULL UNIQUE,
    Password NVARCHAR(255),
    Email NVARCHAR(255) NOT NULL UNIQUE,
    ContactNumber NVARCHAR(50) NOT NULL UNIQUE,
    Role NVARCHAR(50) NOT NULL,
    Status NVARCHAR(50) DEFAULT 'pending',
    CONSTRAINT chk_User_Role CHECK (Role IN ('vendor', 'factory')),
    CONSTRAINT chk_User_Status CHECK (Status IN ('pending', 'approved'))
);

-- 4. Quote Table
CREATE TABLE Quote (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    RFQId UNIQUEIDENTIFIER NOT NULL,
    VendorName NVARCHAR(255),
    Price DECIMAL(18, 2),
    Message NVARCHAR(MAX),
    NumberOfTrucks INT,
    ValidityPeriod NVARCHAR(255),
    Label NVARCHAR(50),
    TrucksAllotted INT,
    NumberOfVehiclesPerDay INT NOT NULL CHECK (NumberOfVehiclesPerDay BETWEEN 1 AND 99),
    CreatedAt DATETIME NOT NULL DEFAULT GETDATE(),
    UpdatedAt DATETIME NOT NULL DEFAULT GETDATE(),
    FOREIGN KEY (RFQId) REFERENCES RFQ(Id)
);

-- 5. RFQ_SelectedVendors Table
CREATE TABLE RFQ_SelectedVendors (
    RFQId UNIQUEIDENTIFIER NOT NULL,
    VendorId UNIQUEIDENTIFIER NOT NULL,
    PRIMARY KEY (RFQId, VendorId),
    FOREIGN KEY (RFQId) REFERENCES RFQ(Id),
    FOREIGN KEY (VendorId) REFERENCES Vendor(Id)
);

-- 6. RFQ_VendorActions Table
CREATE TABLE RFQ_VendorActions (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    RFQId UNIQUEIDENTIFIER NOT NULL,
    Action NVARCHAR(50),
    VendorId UNIQUEIDENTIFIER NOT NULL,
    Timestamp DATETIME NOT NULL DEFAULT GETDATE(),
    FOREIGN KEY (RFQId) REFERENCES RFQ(Id),
    FOREIGN KEY (VendorId) REFERENCES Vendor(Id)
);

-- 7. Verification Table
CREATE TABLE Verification (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    Email NVARCHAR(255) NOT NULL,
    OTP NVARCHAR(10) NOT NULL,
    CreatedAt DATETIME NOT NULL DEFAULT GETDATE()
);


-- post creation please:

-- 1. 
-- Example: Delete OTPs older than 5 minutes
-- DELETE FROM Verification
-- WHERE CreatedAt < DATEADD(MINUTE, -5, GETDATE());