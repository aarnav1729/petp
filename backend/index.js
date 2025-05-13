//REQM_1: LEAF
// import all required modules
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const nodemailer = require("nodemailer");
const { google } = require("googleapis");
const cron = require("node-cron");
const moment = require("moment-timezone");
const http = require("http");
const { Server } = require("socket.io");
//const sql = require('mssql');
const path = require("path");
const axios = require("axios");

// outlook emails
const { Client } = require("@microsoft/microsoft-graph-client");
const { ClientSecretCredential } = require("@azure/identity");

// outlook credentials
const CLIENT_ID = "5a58e660-dc7b-49ec-a48c-1fffac02f721";
const CLIENT_SECRET = "6_I8Q~U7IbS~NERqNeszoCRs2kETiO1Yc3cXAaup";
const TENANT_ID = "1c3de7f3-f8d1-41d3-8583-2517cf3ba3b1";
const SENDER_EMAIL = "leaf@premierenergies.com";

// creating an authentication credential for microsoft graph apis
const credential = new ClientSecretCredential(
  TENANT_ID,
  CLIENT_ID,
  CLIENT_SECRET
);

// creating a microsoft graph client
const client = Client.initWithMiddleware({
  authProvider: {
    getAccessToken: async () => {
      const tokenResponse = await credential.getToken(
        "https://graph.microsoft.com/.default"
      );
      return tokenResponse.token;
    },
  },
});

// create express app
const app = express();
const server = http.createServer(app);

// create socket.io server
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT"],
    allowedHeaders: ["Authorization", "Content-Type"],
    credentials: true,
  },
});

// middleware
app.use(cors({ origin: "*" }));
app.use(express.json());

//mssql config
//const config = {
//  user: 'leaf',
//  password: 'Leaf@123$',
//  server: ' ',
//  port: '',
//  database: 'LEAF',
//  options: {
//    trustServerCertificate: true,
//  }
//}

// socket.io configuration
{
  /*io.on("connection", (socket) => {
  console.log("New client connected:", socket.id);

  socket.on(
    "placeBid",
    async ({ rfqId, vendorName, price, numberOfTrucks }) => {
      try {
        // check if vendor already submitted a quote for this rfq
        let existingQuote = await Quote.findOne({ rfqId, vendorName });

        if (existingQuote) {
          // if existing bid exists, update the bid with fresh quote
          existingQuote.price = price;
          existingQuote.numberOfTrucks = numberOfTrucks;
          await existingQuote.save();
        } else {
          // if existing bid not found, create new bid
          existingQuote = new Quote({
            rfqId,
            vendorName,
            price,
            numberOfTrucks,
            message: "Updated bid",
          });
          await existingQuote.save();
        }

        // fetch the associated RFQ to get number of vehicles
        const rfq = await RFQ.findById(rfqId);
        if (!rfq) {
          console.error(`RFQ with ID ${rfqId} not found.`);
          return;
        }

        // fetch all rfq quotes and sort by price
        const quotes = await Quote.find({ rfqId }).sort({ price: 1 });

        // assign labels and allot trucks based on rfq requirements
        const labeledQuotes = assignQuoteLabels(
          quotes,
          rfq.numberOfVehicles || 0
        );

        // update the vendors with the latest quotes
        io.to(rfqId).emit("updateBids", labeledQuotes);
      } catch (error) {
        console.error("Error placing bid:", error);
      }
    }
  );

  // join the auction room
  socket.on("joinAuctionRoom", (rfqId) => {
    socket.join(rfqId);
  });

  // leave the auction room
  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});*/
}

// connect to monogdb
mongoose
  .connect(
    "mongodb+srv://aarnavsingh836:Cucumber1729@rr.oldse8x.mongodb.net/?retryWrites=true&w=majority&appName=rr",
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
    }
  )
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

// function to send email on rfq creation
async function sendRFQEmail(rfqData, selectedVendorIds) {
  const excludedFields = [
    "_id",
    "budgetedPriceBySalesDept",
    "maxAllowablePrice",
    "customerName",
    "selectedVendors",
    "vendorActions",
    "createdAt",
    "updatedAt",
    "__v",
    "eReverseTime",
    "eReverseDate",
    "sapOrder",
    "status",
    "eReverseToggle",
  ];

  try {
    let vendorsToEmail;

    if (selectedVendorIds && selectedVendorIds.length > 0) {
      vendorsToEmail = await Vendor.find(
        { _id: { $in: selectedVendorIds } },
        "email vendorName"
      );
    } else {
      vendorsToEmail = [];
    }

    const vendorEmails = vendorsToEmail.map((vendor) => vendor.email);

    if (vendorEmails.length > 0) {
      for (const vendor of vendorsToEmail) {
        const emailContent = {
          message: {
            subject: "New RFQ Posted - Submit Initial Quote",
            body: {
              contentType: "HTML",
              content: `
                  <p>Dear Vendor,</p>
                  <p>You are one of the selected vendors for ${
                    rfqData.RFQNumber
                  }.</p>
                  <p>Initial Quote End Time: ${moment(
                    rfqData.initialQuoteEndTime
                  )
                    .tz("Asia/Kolkata")
                    .format("YYYY-MM-DD HH:mm")}</p>
                  <p>Evaluation Period End Time: ${moment(
                    rfqData.evaluationEndTime
                  )
                    .tz("Asia/Kolkata")
                    .format("YYYY-MM-DD HH:mm")}</p>
                  <p>Please log in to your account to submit your quote.</p>
        
                <table border="1" cellpadding="5" cellspacing="0" style="border-collapse: collapse; inline-size: 100%;">
                  <thead>
                    <tr>
                      <th style="background-color: #f2f2f2;">Field</th>
                      <th style="background-color: #f2f2f2;">Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${Object.entries(rfqData)
                      .filter(([key]) => !excludedFields.includes(key))
                      .map(
                        ([key, value]) => `
                      <tr>
                        <td style="padding: 8px; text-align: start;">${key
                          .replace(/([A-Z])/g, " $1")
                          .replace(/^./, (str) => str.toUpperCase())}</td>
                        <td style="padding: 8px; text-align: start;">${value}</td>
                      </tr>
                    `
                      )
                      .join("")}
                  </tbody>
                </table>
                <p>We look forward to receiving your quote.</p>
                <p>Best regards,<br/>Team LEAF.</p>
              `,
            },
            toRecipients: [
              {
                emailAddress: {
                  address: vendor.email,
                },
              },
            ],
            from: {
              emailAddress: {
                address: "leaf@premierenergies.com",
              },
            },
          },
        };

        await client.api(`/users/${SENDER_EMAIL}/sendMail`).post(emailContent);
        console.log(`Email sent to ${vendor.email}`);
      }
      return { success: true };
    } else {
      console.log("No selected vendors to send emails to.");
      return { success: false };
    }
  } catch (error) {
    console.error("Error sending RFQ email:", error);
    return { success: false };
  }
}

// Updated SalesOrder schema – remove maxAllowablePrice and rename/restructure fields
const salesOrderSchema = new mongoose.Schema(
  {
    // For backward compatibility we keep the old orderNumber as an optional legacy field.
    orderNumber: { type: String },
    // New fields:
    projectCode: { type: String, required: true, unique: true },
    customerName: { type: String, required: true },
    projectCapacity: { type: Number, required: true }, // in MW
    siteLocation: { type: String, required: true },
    budgetedPrice: { type: Number, required: true }, // price per MW
    canOverride: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Pre-validate hook to compute projectCode if not provided (for legacy records)
salesOrderSchema.pre("validate", function (next) {
  if (!this.projectCode) {
    // If orderNumber exists (legacy), use it; otherwise compute from new fields.
    this.projectCode =
      this.orderNumber ||
      `${this.customerName}-${this.projectCapacity}-${this.siteLocation}`;
  }
  next();
});

const SalesOrder = mongoose.model("SalesOrder", salesOrderSchema);

// vendor schema and model
const vendorSchema = new mongoose.Schema({
  username: { type: String, unique: true },
  vendorName: { type: String, unique: true },
  password: String,
  email: { type: String, unique: true, required: true },
  contactNumber: { type: String, unique: true, required: true },
  grade: { type: String, default: "A", enum: ["A", "B", "C", "D"] },
});

const Vendor = mongoose.model("Vendor", vendorSchema);

// quote schema and model
const quoteSchema = new mongoose.Schema(
  {
    rfqId: { type: mongoose.Schema.Types.ObjectId, ref: "RFQ" },
    vendorName: String,
    companyName: String,
    price: Number,
    message: String,
    numberOfTrucks: Number,
    validityPeriod: String,
    label: String,
    trucksAllotted: Number,
    actualTrucksProvided: {
      type: Number,
      default: 0,
    },
    numberOfVehiclesPerDay: {
      type: Number,
      required: true,
      min: 1,
      max: 99,
    },
  },
  { timestamps: true }
);

const Quote = mongoose.model("Quote", quoteSchema);

// sales schema and model
const salesSchema = new mongoose.Schema({
  username: { type: String, unique: true },
  salesName: { type: String, unique: true },
  password: String,
  email: { type: String, unique: true, required: true },
  contactNumber: { type: String, unique: true, required: true },
  // Add any additional fields specific to "sales" users here
});

const Sales = mongoose.model("Sales", salesSchema);

// user schema and model
const userSchema = new mongoose.Schema({
  username: { type: String, unique: true },
  password: String,
  email: { type: String, unique: true, required: true },
  contactNumber: { type: String, unique: true, required: true },
  role: { type: String, enum: ["vendor", "factory", "sales"], required: true },
  status: { type: String, enum: ["pending", "approved"], default: "pending" },
});

const User = mongoose.model("User", userSchema);

// rfq schema and model
const rfqSchema = new mongoose.Schema(
  {
    RFQNumber: String,
    shortName: String,
    companyType: String,
    sapOrder: String,
    itemType: String,
    customerName: String,
    originLocation: String,
    dropLocationState: String,
    dropLocationDistrict: String,
    address: { type: String, required: true },
    pincode: {
      type: String,
      required: true,
      validate: {
        validator: function (v) {
          return /^\d{6}$/.test(v);
        },
        message: (props) =>
          `${props.value} is not a valid pincode. It should be exactly 6 digits.`,
      },
    },
    vehicleType: String,
    additionalVehicleDetails: String,
    numberOfVehicles: Number,
    weight: String,
    budgetedPriceBySalesDept: Number,
    eReverseDate: { type: Date, required: false },
    eReverseTime: { type: String, required: false },
    vehiclePlacementBeginDate: Date,
    vehiclePlacementEndDate: Date,
    status: {
      type: String,
      enum: ["initial", "evaluation", "closed"],
      default: "initial",
    },
    initialQuoteEndTime: { type: Date, required: true },
    evaluationEndTime: { type: Date, required: true },
    finalizeReason: { type: String },
    l1Price: Number,
    l1VendorId: { type: mongoose.Schema.Types.ObjectId, ref: "Vendor" },
    RFQClosingDate: Date,
    RFQClosingTime: { type: String, required: true },
    eReverseToggle: { type: Boolean, default: false },
    rfqType: { type: String, enum: ["Long Term", "D2D"], default: "D2D" },
    selectedVendors: [{ type: mongoose.Schema.Types.ObjectId, ref: "Vendor" }],
    projectCode: { type: String },
    mw: { type: Number },
    vendorActions: [
      {
        action: String, // "addedAtCreation", "added", "reminderSent"
        vendorId: { type: mongoose.Schema.Types.ObjectId, ref: "Vendor" },
        timestamp: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true } // Adds createdAt and updatedAt fields
);

// For legacy records: if projectCode is not set but salesOrderNumber exists, assign it.
rfqSchema.pre("save", function (next) {
  if (!this.projectCode && this.salesOrderNumber) {
    this.projectCode = this.salesOrderNumber;
  }
  next();
});

const RFQ = mongoose.model("RFQ", rfqSchema);

// verification schema and model
const verificationSchema = new mongoose.Schema({
  email: { type: String, required: true },
  otp: { type: String, required: true },
  createdAt: { type: Date, default: Date.now, expires: 300 },
});

const Verification = mongoose.model("Verification", verificationSchema);

// LRNumber schema and model
const lrNumberSchema = new mongoose.Schema({
  rfqId: { type: mongoose.Schema.Types.ObjectId, ref: "RFQ" },
  vendorName: String,
  lrNumbers: [String],
});

const LRNumber = mongoose.model("LRNumber", lrNumberSchema);

// api endpoints

// endpoint to send OTP to user's email
app.post("/api/send-otp", async (req, res) => {
  const { email } = req.body;

  // generate a 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  try {
    // save the OTP to the database
    const newVerification = new Verification({ email, otp });
    await newVerification.save();

    // create the email content
    const emailContent = {
      message: {
        subject: "Your OTP for Registration",
        body: {
          contentType: "Text",
          content: `Your OTP for registration is: ${otp}. It is valid for 5 minutes.`,
        },
        toRecipients: [
          {
            emailAddress: {
              address: email,
            },
          },
        ],
        from: {
          emailAddress: {
            address: SENDER_EMAIL,
          },
        },
      },
    };

    // send the email using Microsoft Graph API
    await client.api(`/users/${SENDER_EMAIL}/sendMail`).post(emailContent);

    res.status(200).json({ success: true, message: "OTP sent to email." });
  } catch (error) {
    console.error("Error sending OTP:", error);
    res.status(500).json({ success: false, message: "Failed to send OTP." });
  }
});

// endpoint to verify OTP
app.post("/api/verify-otp", async (req, res) => {
  const { email, otp } = req.body;

  try {
    const verification = await Verification.findOne({ email, otp });
    if (verification) {
      // OTP is correct
      // Remove the verification entry
      await Verification.deleteOne({ _id: verification._id });
      res.status(200).json({ success: true, message: "OTP verified." });
    } else {
      res.status(400).json({ success: false, message: "Invalid OTP." });
    }
  } catch (error) {
    console.error("Error verifying OTP:", error);
    res.status(500).json({ success: false, message: "Failed to verify OTP." });
  }
});

// endpoint for logging in
app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;

  // Check if the user is admin
  if (username === "aarnav" && password === "aarnav") {
    // Return success response with role 'admin'
    return res
      .status(200)
      .json({ success: true, role: "admin", username: "aarnav" });
  }

  try {
    // Find the user without specifying the role
    const user = await User.findOne({ username, password });

    if (user) {
      if (user.status === "approved") {
        return res
          .status(200)
          .json({ success: true, role: user.role, username: user.username });
      } else {
        return res
          .status(403)
          .json({ success: false, message: "Account pending admin approval" });
      }
    } else {
      return res
        .status(401)
        .json({ success: false, message: "Invalid username or password" });
    }
  } catch (error) {
    console.error("Error during login:", error);
    return res.status(500).json({ success: false });
  }
});

// endpoint to fetch all pending accounts
app.get("/api/pending-accounts", async (req, res) => {
  try {
    const pendingAccounts = await User.find({ status: "pending" });
    res.status(200).json(pendingAccounts);
  } catch (error) {
    console.error("Error fetching pending accounts:", error);
    res.status(500).json({ error: "Failed to fetch pending accounts" });
  }
});

// endpoint to approve a user account
app.post("/api/approve-account/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByIdAndUpdate(
      id,
      { status: "approved" },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // If the user is a vendor, create an entry in the Vendor collection
    if (user.role === "vendor") {
      const newVendor = new Vendor({
        username: user.username,
        password: user.password,
        email: user.email,
        contactNumber: user.contactNumber,
        vendorName: user.username,
      });
      await newVendor.save();
    }

    // If the user is a sales, create an entry in the Sales collection
    else if (user.role === "sales") {
      const newSales = new Sales({
        username: user.username,
        salesName: user.username, // You can modify this if there's a separate field
        password: user.password,
        email: user.email,
        contactNumber: user.contactNumber,
      });
      await newSales.save();
    }

    // create the email content
    const emailContent = {
      message: {
        subject: "Account Approved",
        body: {
          contentType: "Text",
          content: `
            Dear ${user.username},
            
            Congratulations! Your account has been approved by the admin.
            You can now log in to the portal using your credentials.

            Best regards,
            Team LEAF.
          `,
        },
        toRecipients: [
          {
            emailAddress: {
              address: user.email,
            },
          },
        ],
        from: {
          emailAddress: {
            address: SENDER_EMAIL,
          },
        },
      },
    };

    // send the email using Microsoft Graph API
    await client.api(`/users/${SENDER_EMAIL}/sendMail`).post(emailContent);

    res.status(200).json({ message: "User account approved and email sent." });
  } catch (error) {
    console.error("Error approving user account:", error);
    res.status(500).json({ error: "Failed to approve user account" });
  }
});

// endpoint for fetching active auctions
{
  /* app.get("/api/active-auctions", async (req, res) => {
  try {
    // get the current time in IST
    const now = moment().tz("Asia/Kolkata");
    // log the current time
    console.log("Current time (IST):", now.format());

    // fetch all rfqs without filtering by status
    const rfqs = await RFQ.find();
    // log the total rfqs fetched
    console.log("Total RFQs fetched:", rfqs.length);

    // filter rfqs based on the 2-hour window before and after the ereversedate and ereversetime
    const activeAuctions = rfqs.filter((rfq) => {
      // check if ereversetoggle is enabled
      if (!rfq.eReverseToggle) return false;
      // create a moment object for the ereversedate and ereversetime
      const eReverseDateTime = moment.tz(
        `${moment(rfq.eReverseDate).format("YYYY-MM-DD")}T${
          rfq.eReverseTime
        }:00`,
        "Asia/Kolkata"
      );
      // log the rfq number and ereversedatetime
      console.log(
        `RFQ ${rfq.RFQNumber} eReverseDateTime (IST):`,
        eReverseDateTime.format()
      );

      // calculate the 2-hour window before and after the ereversedatetime
      const twoHoursBefore = eReverseDateTime.clone().subtract(2, "hours");
      const twoHoursAfter = eReverseDateTime.clone().add(2, "hours");

      // log the 2-hour window before and after the ereversedatetime
      console.log("Two hours before (IST):", twoHoursBefore.format());
      console.log("Two hours after (IST):", twoHoursAfter.format());

      // check if the current time is within this window
      const isActive = now.isBetween(twoHoursBefore, twoHoursAfter);
      // log the rfq number and whether it is active
      console.log(`RFQ ${rfq.RFQNumber} is active:`, isActive);

      // return whether the rfq is active
      return isActive;
    });

    // log the total active auctions
    console.log("Active Auctions:", activeAuctions.length);
    res.status(200).json(activeAuctions);
  } catch (error) {
    // log error if fetching active auctions fails
    console.error("Error fetching active auctions:", error);
    res.status(500).json({ error: "Failed to fetch active auctions" });
  }
});*/
}

app.get("/api/vendors/participation-conversion", async (req, res) => {
  try {
    // Fetch all vendors
    const vendors = await Vendor.find();

    // Initialize result array
    const results = [];

    for (const vendor of vendors) {
      // Step 1: Fetch the total number of RFQs sent to this vendor
      const rfqsInvited = await RFQ.countDocuments({
        selectedVendors: vendor._id,
      });

      // Step 2: Count RFQs where the vendor placed a bid
      const rfqsParticipated = await Quote.countDocuments({
        vendorName: vendor.vendorName,
      });

      // Step 3: Count RFQs where trucks were allotted to this vendor
      const rfqsConverted = await Quote.countDocuments({
        vendorName: vendor.vendorName,
        trucksAllotted: { $gt: 0 },
      });

      // Step 4: Calculate participation and conversion rates
      const participationRate =
        rfqsInvited > 0 ? (rfqsParticipated / rfqsInvited) * 100 : 0;
      const conversionRate =
        rfqsParticipated > 0 ? (rfqsConverted / rfqsParticipated) * 100 : 0;

      // Add vendor's stats to the result array
      results.push({
        vendorName: vendor.vendorName,
        email: vendor.email,
        contactNumber: vendor.contactNumber,
        rfqsInvited,
        rfqsParticipated,
        rfqsConverted,
        participationRate: participationRate.toFixed(2),
        conversionRate: conversionRate.toFixed(2),
      });
    }

    // Send the results as response
    res.status(200).json(results);
  } catch (error) {
    console.error("Error fetching participation and conversion rates:", error);
    res.status(500).json({
      error: "Failed to fetch participation and conversion rates.",
    });
  }
});

app.get("/api/vendor/rfq/:rfqId/details/:vendorName", async (req, res) => {
  try {
    const { rfqId, vendorName } = req.params;

    // Fetch the RFQ
    const rfq = await RFQ.findById(rfqId);
    if (!rfq) {
      return res.status(404).json({ error: "RFQ not found" });
    }

    // Fetch the vendor's quote
    const vendorQuote = await Quote.findOne({
      rfqId,
      vendorName,
    });

    if (!vendorQuote || vendorQuote.trucksAllotted <= 0) {
      return res.status(400).json({
        error: "No trucks allotted to this vendor for this RFQ.",
      });
    }

    // Fetch existing LR numbers if any
    const lrNumberEntry = await LRNumber.findOne({
      rfqId,
      vendorName,
    });

    res.status(200).json({
      rfq,
      trucksAllotted: vendorQuote.trucksAllotted,
      lrNumbers: lrNumberEntry ? lrNumberEntry.lrNumbers : [],
    });
  } catch (error) {
    console.error("Error fetching RFQ details:", error);
    res.status(500).json({ error: "Failed to fetch RFQ details." });
  }
});

app.post("/api/vendor/rfq/:rfqId/submit-lr-numbers", async (req, res) => {
  try {
    const { rfqId } = req.params;
    const { username: vendorName, lrNumbers } = req.body;

    // Fetch the vendor's quote
    const vendorQuote = await Quote.findOne({
      rfqId,
      vendorName,
    });

    if (!vendorQuote || vendorQuote.trucksAllotted <= 0) {
      return res.status(400).json({
        error: "No trucks allotted to this vendor for this RFQ.",
      });
    }

    if (lrNumbers.length !== vendorQuote.trucksAllotted) {
      return res.status(400).json({
        error: `Please provide LR numbers for all ${vendorQuote.trucksAllotted} trucks allotted.`,
      });
    }

    // Save or update LR numbers
    const existingEntry = await LRNumber.findOne({
      rfqId,
      vendorName,
    });

    if (existingEntry) {
      existingEntry.lrNumbers = lrNumbers;
      await existingEntry.save();
    } else {
      const newLRNumber = new LRNumber({
        rfqId,
        vendorName,
        lrNumbers,
      });
      await newLRNumber.save();
    }

    res.status(200).json({ message: "LR Numbers submitted successfully." });
  } catch (error) {
    console.error("Error submitting LR Numbers:", error);
    res.status(500).json({ error: "Failed to submit LR Numbers." });
  }
});

// endpoint to fetch all RFQs
// endpoint to fetch all relevant RFQs
app.get("/api/tfr/rfqs", async (req, res) => {
  try {
    // Fetch RFQs with statuses you want to include
    const rfqs = await RFQ.find({
      status: { $in: ["initial", "evaluation", "closed"] },
    });
    res.status(200).json(rfqs);
  } catch (error) {
    console.error("Error fetching RFQs:", error);
    res.status(500).json({ error: "Failed to fetch RFQs" });
  }
});

// endpoint to fetch vendors and their allotted trucks for a specific RFQ
// endpoint to fetch all vendors and their quotes for a specific RFQ
app.get("/api/tfr/rfqs/:rfqId/vendors", async (req, res) => {
  const { rfqId } = req.params;
  try {
    // Fetch all quotes for the RFQ
    const quotes = await Quote.find({ rfqId });
    res.status(200).json(quotes);
  } catch (error) {
    console.error("Error fetching vendors for RFQ:", error);
    res.status(500).json({ error: "Failed to fetch vendors for RFQ" });
  }
});

// endpoint to update actual trucks provided by vendors for an RFQ
app.post("/api/tfr/rfqs/:rfqId/update-trucks", async (req, res) => {
  const { rfqId } = req.params;
  const { trucksData } = req.body;

  try {
    for (const data of trucksData) {
      const { quoteId, actualTrucksProvided } = data;

      // Fetch the quote to get trucksAllotted
      const quote = await Quote.findById(quoteId);

      if (!quote) {
        return res.status(404).json({ error: "Quote not found" });
      }

      if (
        actualTrucksProvided < 0 ||
        actualTrucksProvided > quote.trucksAllotted
      ) {
        return res.status(400).json({
          error: `Actual trucks provided cannot exceed trucks allotted for vendor ${quote.vendorName}`,
        });
      }

      // Update the quote
      await Quote.findByIdAndUpdate(quoteId, {
        actualTrucksProvided,
      });
    }

    res
      .status(200)
      .json({ message: "Actual trucks provided updated successfully" });
  } catch (error) {
    console.error("Error updating actual trucks provided:", error);
    res.status(500).json({ error: "Failed to update actual trucks provided" });
  }
});

// Endpoint to update Max Allowable Price and Budgeted Price for an RFQ
app.patch("/api/rfq/:id/update-prices", async (req, res) => {
  try {
    const { id } = req.params;
    const { maxAllowablePrice, budgetedPriceBySalesDept } = req.body;

    // Validate input
    if (
      maxAllowablePrice === undefined ||
      budgetedPriceBySalesDept === undefined
    ) {
      return res.status(400).json({
        error:
          "Both maxAllowablePrice and budgetedPriceBySalesDept are required.",
      });
    }

    if (
      typeof maxAllowablePrice !== "number" ||
      typeof budgetedPriceBySalesDept !== "number"
    ) {
      return res.status(400).json({
        error:
          "maxAllowablePrice and budgetedPriceBySalesDept must be numbers.",
      });
    }

    // Find and update the RFQ
    const updatedRFQ = await RFQ.findByIdAndUpdate(
      id,
      {
        maxAllowablePrice,
        budgetedPriceBySalesDept,
      },
      { new: true }
    );

    if (!updatedRFQ) {
      return res.status(404).json({ error: "RFQ not found." });
    }

    res.status(200).json({
      message: "RFQ prices updated successfully.",
      rfq: updatedRFQ,
    });
  } catch (error) {
    console.error("Error updating RFQ prices:", error);
    res.status(500).json({ error: "Failed to update RFQ prices." });
  }
});

// endpoint for vendor registration
app.post("/api/register", async (req, res) => {
  const { username, password, vendorName, email, contactNumber, role } =
    req.body;

  try {
    const newUser = new User({
      username,
      password,
      email,
      contactNumber,
      role,
      status: "pending",
    });
    await newUser.save();

    // create the email content
    const emailContent = {
      message: {
        subject: "Welcome to Premier Energies",
        body: {
          contentType: "Text",
          content: `
            Dear ${username},
            
            Welcome to LEAF by Premier Energies! We're excited to have you onboard.

            Here are your login credentials:
            Username: ${username}
            Password: ${password}

            Thank you for registering with us! Your account is currently pending admin approval.
            You will be notified once your account has been approved.

            Best regards,
            Team LEAF.
          `,
        },
        toRecipients: [
          {
            emailAddress: {
              address: email,
            },
          },
        ],
        from: {
          emailAddress: {
            address: SENDER_EMAIL,
          },
        },
      },
    };

    // send the email using Microsoft Graph API
    await client.api(`/users/${SENDER_EMAIL}/sendMail`).post(emailContent);

    res.status(201).json({
      success: true,
      message: "User registered successfully and welcome email sent.",
    });
  } catch (error) {
    console.error("Error registering vendor:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to register vendor." });
  }
});

// endpoint to check and return vendor specific rfqs
app.get("/api/rfqs/vendor/:username", async (req, res) => {
  const { username } = req.params;
  try {
    // Find the vendor's _id using username
    const vendor = await Vendor.findOne({ username });
    if (!vendor) {
      return res.status(404).json({ error: "Vendor not found" });
    }

    // Query RFQs where selectedVendors includes vendor._id
    const rfqs = await RFQ.find({
      selectedVendors: vendor._id,
    });

    res.status(200).json(rfqs);
  } catch (error) {
    console.error("Error fetching RFQs for vendor:", error);
    res.status(500).json({ error: "Failed to fetch RFQs for vendor" });
  }
});

// endpoint for adding a vendor from VendorList.jsx
app.post("/api/add-vendor", async (req, res) => {
  try {
    const { username, password, email, contactNumber } = req.body;

    const newVendor = new Vendor({
      username,
      password,
      email,
      vendorName: username,
      contactNumber,
    });

    await newVendor.save();

    const newUser = new User({
      username,
      password,
      email,
      contactNumber,
      role: "vendor",
      status: "approved",
    });

    await newUser.save();

    const emailContent = {
      message: {
        subject: "Welcome to Leaf",
        body: {
          contentType: "Text",
          content: `
            Dear ${username},

            Welcome to LEAF by Premier Energies! We're excited to have you onboard.

            Here are your login credentials:
            Username: ${username}
            Password: ${password}

            Thank you for registering with us! Your account is currently pending admin approval.
            You will be notified once your account has been approved.

            Best regards,
            Team LEAF.
          `,
        },
        toRecipients: [
          {
            emailAddress: {
              address: email,
            },
          },
        ],
        from: {
          emailAddress: {
            address: SENDER_EMAIL,
          },
        },
      },
    };

    await client.api(`/users/${SENDER_EMAIL}/sendMail`).post(emailContent);

    res.status(201).json({ message: "Vendor added successfully!" });
  } catch (error) {
    console.error("Error adding vendor:", error.message);
    res.status(500).json({ error: "Failed to add vendor" });
  }
});

// endpoint for fetching the next available RFQ number
app.get("/api/next-rfq-number", async (req, res) => {
  try {
    // Fetch the last created RFQ to get the current highest RFQNumber
    const lastRFQ = await RFQ.findOne().sort({ _id: -1 });

    // Initialize RFQ number, increment from the last RFQ number or start at RFQ1
    const nextRFQNumber = lastRFQ
      ? `RFQ${parseInt(lastRFQ.RFQNumber.slice(3)) + 1}`
      : "RFQ1";

    // Return the next available RFQ number
    res.status(200).json({ RFQNumber: nextRFQNumber });
  } catch (error) {
    console.error("Error fetching next RFQ number:", error);
    res.status(500).json({ error: "Failed to fetch next RFQ number" });
  }
});

// endpoint for creating a new RFQ
app.post("/api/rfq", async (req, res) => {
  try {
    const formData = req.body;
    const now = moment().tz("Asia/Kolkata");
    // Parse initialQuoteEndTime and evaluationEndTime from req.body

    const initialQuoteEndTime = moment
      .tz(req.body.initialQuoteEndTime, "YYYY-MM-DDTHH:mm", "Asia/Kolkata")
      .toDate();
    const evaluationEndTime = moment
      .tz(req.body.evaluationEndTime, "YYYY-MM-DDTHH:mm", "Asia/Kolkata")
      .toDate();

    // Validate that evaluationEndTime is after initialQuoteEndTime
    if (evaluationEndTime <= initialQuoteEndTime) {
      return res.status(400).json({
        error: "Evaluation End Time must be after Initial Quote End Time",
      });
    }

    // Fetch the last created RFQ to get the current highest RFQNumber
    const lastRFQ = await RFQ.findOne().sort({ _id: -1 });

    // Initialize RFQ number, increment from the last RFQ number or start at RFQ1
    const nextRFQNumber = lastRFQ
      ? `RFQ${parseInt(lastRFQ.RFQNumber.slice(3)) + 1}`
      : "RFQ1";

    // Add the generated RFQ number to the request body
    const newRFQData = {
      ...req.body,
      RFQNumber: nextRFQNumber,
      status: "initial",
      initialQuoteEndTime,
      evaluationEndTime,
      selectedVendors: req.body.selectedVendors,
    };

    // create a new RFQ with the generated number
    const rfq = new RFQ(newRFQData);

    if (req.body.selectedVendors && req.body.selectedVendors.length > 0) {
      req.body.selectedVendors.forEach((vendorId) => {
        rfq.vendorActions.push({
          action: "addedAtCreation",
          vendorId,
          timestamp: new Date(),
        });
      });
    }

    await rfq.save();

    // send email to vendors
    const emailResponse = await sendRFQEmail(
      newRFQData,
      req.body.selectedVendors
    );

    if (!emailResponse.success) {
      // If email sending fails, remove the RFQ entry to prevent incomplete processes
      await RFQ.findByIdAndDelete(rfq._id);
      return res.status(500).json({
        message:
          "RFQ created but failed to send emails. RFQ entry has been removed.",
      });
    }

    // If everything is successful, return the response
    res.status(201).json({
      message: "RFQ created and email sent successfully",
      RFQNumber: nextRFQNumber,
    });
  } catch (error) {
    console.error("Error creating RFQ:", error);
    res.status(500).json({ error: "Failed to create RFQ" });
  }
});

// endpoint for fetching all RFQs
app.get("/api/rfqs", async (req, res) => {
  try {
    const rfqs = await RFQ.find();
    res.status(200).json(rfqs);
  } catch (error) {
    console.error("Error fetching RFQs:", error);
    res.status(500).json({ error: "Failed to fetch RFQs" });
  }
});

// endpoint for vendor to submit a quote
app.post("/api/quote", async (req, res) => {
  try {
    const {
      rfqId,
      quote,
      message,
      vendorName,
      numberOfTrucks,
      validityPeriod,
      numberOfVehiclesPerDay,
    } = req.body;

    // Fetch the RFQ to get numberOfVehicles
    const rfq = await RFQ.findById(rfqId);
    if (!rfq) {
      return res.status(404).json({ error: "RFQ not found" });
    }

    const now = moment().tz("Asia/Kolkata");

    const minTrucksRequired = Math.floor(0.39 * rfq.numberOfVehicles);

    if (numberOfTrucks < minTrucksRequired) {
      return res.status(400).json({
        error: `Number of Trucks must be at least ${minTrucksRequired}`,
      });
    }

    if (rfq.status === "initial") {
      if (now.isAfter(rfq.initialQuoteEndTime)) {
        return res
          .status(400)
          .json({ error: "Initial quote period has ended." });
      }

      // Allow submission of initial quotes
      // Save or update the quote
      let existingQuote = await Quote.findOne({ rfqId, vendorName });
      if (existingQuote) {
        existingQuote.price = quote;
        existingQuote.numberOfTrucks = numberOfTrucks;
        existingQuote.numberOfVehiclesPerDay = numberOfVehiclesPerDay;
        existingQuote.message = message;
        existingQuote.validityPeriod = validityPeriod;
        await existingQuote.save();
      } else {
        const newQuote = new Quote({
          rfqId,
          vendorName,
          price: quote,
          numberOfTrucks,
          numberOfVehiclesPerDay,
          message,
          validityPeriod,
        });
        await newQuote.save();
      }

      const emailContent = {
        message: {
          subject: `Initial Quote Submitted by ${vendorName} for RFQ ${rfq.RFQNumber}`,
          body: {
            contentType: "Text",
            content: `
              A new quote has been submitted for RFQ ID: ${rfqId}.
              Vendor: ${vendorName}
              Quote: ${quote}
              Number of Trucks: ${numberOfTrucks}
              Validity Period: ${validityPeriod}
              Message: ${message}
            `,
          },
          toRecipients: [
            {
              emailAddress: {
                address: SENDER_EMAIL,
              },
            },
          ],
          from: {
            emailAddress: {
              address: SENDER_EMAIL,
            },
          },
        },
      };

      await client.api(`/users/${SENDER_EMAIL}/sendMail`).post(emailContent);

      res.status(200).json({ message: "Quote submitted successfully." });
    } else if (rfq.status === "evaluation") {
      // only allow vendors who submitted initial quotes to update
      const existingQuote = await Quote.findOne({ rfqId, vendorName });
      if (!existingQuote) {
        return res
          .status(400)
          .json({ error: "You did not submit an initial quote." });
      }

      if (vendorName === rfq.l1VendorId) {
        return res
          .status(400)
          .json({ error: "L1 vendor cannot update the quote." });
      }

      // allow updating the quote
      existingQuote.price = quote;
      existingQuote.numberOfTrucks = numberOfTrucks;
      existingQuote.numberOfVehiclesPerDay = numberOfVehiclesPerDay;
      existingQuote.message = message;
      existingQuote.validityPeriod = validityPeriod;
      await existingQuote.save();

      const emailContent = {
        message: {
          subject: `Quote Updated by ${vendorName} for RFQ ${rfqId}`,
          body: {
            contentType: "Text",
            content: `
              A quote has been updated for RFQ ID: ${rfqId}.
              Vendor: ${vendorName}
              Quote: ${quote}
              Number of Trucks: ${numberOfTrucks}
              Validity Period: ${validityPeriod}
              Message: ${message}
            `,
          },
          toRecipients: [
            {
              emailAddress: {
                address: SENDER_EMAIL,
              },
            },
          ],
          from: {
            emailAddress: {
              address: SENDER_EMAIL,
            },
          },
        },
      };

      await client.api(`/users/${SENDER_EMAIL}/sendMail`).post(emailContent);

      res.status(200).json({ message: "Quote updated successfully." });
    } else {
      return res
        .status(400)
        .json({ error: "RFQ is closed. You cannot submit a quote." });
    }
  } catch (error) {
    console.error("Error submitting quote:", error);
    res.status(500).json({ error: "Failed to submit quote." });
  }
});

// endpoint to update an existing quote
app.put("/api/quote/:quoteId", async (req, res) => {
  try {
    const { quoteId } = req.params;
    const {
      rfqId,
      quote,
      message,
      vendorName,
      numberOfTrucks,
      numberOfVehiclesPerDay,
      validityPeriod,
    } = req.body;

    // fetch the RFQ to get numberOfVehicles
    const rfq = await RFQ.findById(rfqId);
    if (!rfq) {
      return res.status(404).json({ error: "RFQ not found" });
    }

    const minTrucksRequired = Math.floor(0.39 * rfq.numberOfVehicles);

    if (numberOfTrucks < minTrucksRequired) {
      return res.status(400).json({
        error: `Number of Trucks must be at least ${minTrucksRequired}`,
      });
    }

    // find the quote by ID and update it
    const updatedQuote = await Quote.findByIdAndUpdate(
      quoteId,
      {
        rfqId,
        vendorName,
        price: quote,
        numberOfTrucks,
        numberOfVehiclesPerDay,
        validityPeriod,
        message,
      },
      { new: true } // return the updated document
    );

    if (!updatedQuote) {
      return res.status(404).json({ error: "Quote not found" });
    }

    const emailContent = {
      message: {
        subject: `Quote Updated for RFQ ${rfqId}`,
        body: {
          contentType: "Text",
          content: `
            A quote has been updated for RFQ ID: ${rfqId}.
            Vendor: ${vendorName}
            Quote: ${quote}
            Number of Trucks: ${numberOfTrucks}
            Validity Period: ${validityPeriod}
            Message: ${message}
          `,
        },
        toRecipients: [
          {
            emailAddress: {
              address: SENDER_EMAIL, // send to leaf@premierenergies.com
            },
          },
        ],
        from: {
          emailAddress: {
            address: SENDER_EMAIL, // send from leaf@premierenergies.com
          },
        },
      },
    };

    // Send the email using Microsoft Graph API
    await client.api(`/users/${SENDER_EMAIL}/sendMail`).post(emailContent);

    res.status(200).json({ message: "Quote updated and email sent to admin" });
  } catch (error) {
    console.error("Error updating quote:", error);
    res.status(500).json({ error: "Failed to update quote" });
  }
});

// endpoint to fetch a specific RFQ by ID
app.get("/api/rfq/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // ensure that the ID is valid for mongodb object id
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid RFQ ID" });
    }

    // fetch the RFQ and populate the necessary fields
    const rfq = await RFQ.findById(id)
      .populate("selectedVendors")
      .populate("vendorActions.vendorId")
      .lean(); // using .lean() to get a plain js object
    if (!rfq) {
      return res.status(404).json({ error: "RFQ not found" });
    }

    // fetch quotes for this RFQ, including labels and trucksAllotted
    const quotes = await Quote.find({ rfqId: id });

    // add quotes to the rfq object
    rfq.quotes = quotes;

    res.status(200).json(rfq);
  } catch (error) {
    console.error("Error fetching RFQ details:", error);
    res.status(500).json({ error: "Failed to fetch RFQ details" });
  }
});

// endpoint to add vendors to an existing rfq
app.post("/api/rfq/:id/add-vendors", async (req, res) => {
  const { id } = req.params;
  const { vendorIds } = req.body;

  try {
    const rfq = await RFQ.findById(id);
    if (!rfq) {
      return res.status(404).json({ error: "RFQ not found" });
    }

    // update the selectedVendors list
    const existingVendorIds = rfq.selectedVendors.map((vendorId) =>
      vendorId.toString()
    );
    const newVendorIds = vendorIds.filter(
      (vendorId) => !existingVendorIds.includes(vendorId)
    );

    rfq.selectedVendors = rfq.selectedVendors.concat(newVendorIds);

    // record the vendor addition actions
    newVendorIds.forEach((vendorId) => {
      rfq.vendorActions.push({
        action: "added",
        vendorId,
        timestamp: new Date(),
      });
    });

    await rfq.save();

    // convert the RFQ document to a plain js object
    const rfqData = rfq.toObject();

    // send RFQ email to the newly added vendors
    const emailResponse = await sendRFQEmail(rfqData, newVendorIds);

    if (!emailResponse.success) {
      return res
        .status(500)
        .json({ message: "Failed to send emails to added vendors." });
    }

    res
      .status(200)
      .json({ message: "Vendors added and emails sent successfully." });
  } catch (error) {
    console.error("Error adding vendors to RFQ:", error);
    res.status(500).json({ error: "Failed to add vendors to RFQ" });
  }
});

// endpoint to fetch all quotes
app.get("/api/quotes", async (req, res) => {
  try {
    const quotes = await Quote.find();
    res.status(200).json(quotes);
  } catch (error) {
    console.error("Error fetching quotes:", error);
    res.status(500).json({ error: "Failed to fetch quotes" });
  }
});

// endpoint to fetch all factory users
app.get("/api/factory-users", async (req, res) => {
  try {
    const factoryUsers = await User.find({ role: "factory" });
    res.status(200).json(factoryUsers);
  } catch (error) {
    console.error("Error fetching factory users:", error);
    res
      .status(500)
      .json({ error: "Failed to fetch factory users", details: error.message });
  }
});

// endpoint to add a new factory user from vendorlist
app.post("/api/add-factory-user", async (req, res) => {
  try {
    const { username, password, email, contactNumber } = req.body;

    const newUser = new User({
      username,
      password,
      email,
      contactNumber,
      role: "factory",
      status: "approved",
    });

    await newUser.save();

    const emailContent = {
      message: {
        subject: "Welcome to Leaf",
        body: {
          contentType: "Text",
          content: `
            Dear ${username},

            Welcome to LEAF by Premier Energies! We're excited to have you onboard.

            Here are your login credentials:
            Username: ${username}
            Password: ${password}

            Thank you for registering with us! Your account is currently pending admin approval.
            You will be notified once your account has been approved.

            Best regards,
            Team LEAF
          `,
        },
        toRecipients: [
          {
            emailAddress: {
              address: email,
            },
          },
        ],
        from: {
          emailAddress: {
            address: SENDER_EMAIL,
          },
        },
      },
    };

    await client.api(`/users/${SENDER_EMAIL}/sendMail`).post(emailContent);

    res.status(201).json({ message: "Factory user added successfully!" });
  } catch (error) {
    console.error("Error adding factory user:", error.message);
    res.status(500).json({ error: "Failed to add factory user" });
  }
});

// endpoint to delete a factory user by id
app.delete("/api/factory-users/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByIdAndDelete(id);

    if (!user) {
      return res.status(404).json({ error: "Factory user not found" });
    }

    res.status(200).json({ message: "Factory user deleted successfully" });
  } catch (error) {
    console.error("Error deleting factory user:", error);
    res.status(500).json({ error: "Failed to delete factory user" });
  }
});

// endpoint to fetch quotes for a specific RFQ
app.get("/api/quotes/:rfqId", async (req, res) => {
  try {
    const { rfqId } = req.params;
    const quotes = await Quote.find({ rfqId });
    res.status(200).json(quotes);
  } catch (error) {
    console.error("Error fetching quotes:", error);
    res.status(500).json({ error: "Failed to fetch quotes" });
  }
});

// endpoint to fetch all vendors and their details
app.get("/api/vendors", async (req, res) => {
  try {
    const vendors = await Vendor.find();
    res.status(200).json(vendors);
  } catch (error) {
    console.error("Error fetching vendors:", error);
    res.status(500).json({ error: "Failed to fetch vendors" });
  }
});

app.post("/api/decline-account/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const emailContent = {
      message: {
        subject: "Account Rejected",
        body: {
          contentType: "Text",
          content: `
            Dear ${user.username},

            We regret to inform you that your account registration has been rejected by the admin.

            For any further inquiries, please contact our support team.

            Best regards,
            Team LEAF
          `,
        },
        toRecipients: [
          {
            emailAddress: {
              address: user.email,
            },
          },
        ],
        from: {
          emailAddress: {
            address: SENDER_EMAIL,
          },
        },
      },
    };

    await client.api(`/users/${SENDER_EMAIL}/sendMail`).post(emailContent);
    await User.findByIdAndDelete(id);

    res.status(200).json({ message: "User account declined and email sent." });
  } catch (error) {
    console.error("Error declining user account:", error);
    res.status(500).json({ error: "Failed to decline user account" });
  }
});

// endpoint to delete a vendor by ID
app.delete("/api/vendors/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const vendor = await Vendor.findByIdAndDelete(id);

    if (!vendor) {
      return res.status(404).json({ error: "Vendor not found" });
    }

    // also delete from User collection
    await User.findOneAndDelete({ username: vendor.username });

    res.status(200).json({ message: "Vendor deleted successfully" });
  } catch (error) {
    console.error("Error deleting vendor:", error);
    res.status(500).json({ error: "Failed to delete vendor" });
  }
});

// PATCH endpoint for updating RFQ status
app.patch("/api/rfq/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const normalizedStatus = status.toLowerCase();

    // ensure that the ID is valid for MongoDB ObjectID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid RFQ ID" });
    }

    const rfq = await RFQ.findByIdAndUpdate(
      id,
      { status: normalizedStatus },
      { new: true }
    );
    if (!rfq) {
      return res.status(404).json({ error: "RFQ not found" });
    }
    res.status(200).json(rfq);
  } catch (error) {
    console.error("Error updating RFQ status:", error);
    res.status(500).json({ error: "Failed to update RFQ status" });
  }
});

// function to assign labels and actual trucks allotted
//async function assignInitialLabelsAndTrucks(rfq) {
//try {
// fetch all initial quotes
//const initialQuotes = await Quote.find({ rfqId: rfq._id });

// assign labels based on price (ascending order)
//    const sortedQuotes = initialQuotes.sort((a, b) => a.price - b.price);

// assign labels and trucks
//    let totalTrucks = rfq.numberOfVehicles;
//    let totalTrucksAllocated = 0;

//    for (let i = 0; i < sortedQuotes.length; i++) {
//    const quote = sortedQuotes[i];
//  let label = `L${i + 1}`;
//let trucksAllotted = 0;

//      if (i === 0) {
// L1 vendor
//      label = "L1";
//    trucksAllotted = Math.ceil(totalTrucks * 0.4); // 40% of total trucks
//  totalTrucksAllocated += trucksAllotted;
//rfq.l1Price = quote.price;
//const vendor = await Vendor.findOne({ vendorName: quote.vendorName });
//rfq.l1VendorId = vendor._id;
//} else {
// allocate remaining trucks equally among other vendors
//const remainingTrucks = totalTrucks - totalTrucksAllocated;
//const numVendorsLeft = sortedQuotes.length - i;
//trucksAllotted = Math.ceil(remainingTrucks / numVendorsLeft);
//totalTrucksAllocated += trucksAllotted;
//}

// update the quote with label and trucks allotted
//      await Quote.findByIdAndUpdate(quote._id, {
//      label,
//    trucksAllotted,
//});
//}
//} catch (error) {
//console.error("Error assigning labels and trucks:", error);
//}
//}

async function allocateTrucksBasedOnPrice(rfqId) {
  try {
    const rfq = await RFQ.findById(rfqId);
    const requiredTrucks = rfq.numberOfVehicles;

    if (!requiredTrucks || requiredTrucks <= 0) {
      console.error("Invalid required trucks");
      return;
    }

    let quotes = await Quote.find({ rfqId });

    // Sort the quotes with the enhanced logic
    quotes.sort((a, b) => {
      if (a.price !== b.price) {
        return a.price - b.price; // Ascending price
      } else {
        return new Date(a.createdAt) - new Date(b.createdAt); // Earlier bids first
      }
    });

    let totalTrucks = 0;
    let i = 0;
    let labelCounter = 1;

    while (i < quotes.length && totalTrucks < requiredTrucks) {
      const currentPrice = quotes[i].price;
      const samePriceQuotes = [];

      // Collect all quotes with the same price
      while (i < quotes.length && quotes[i].price === currentPrice) {
        samePriceQuotes.push(quotes[i]);
        i++;
      }

      // Assign the same label to all vendors with the same price
      const label = `L${labelCounter}`;

      // Calculate total trucks offered by vendors at this price
      const totalOfferedTrucks = samePriceQuotes.reduce(
        (sum, q) => sum + q.numberOfTrucks,
        0
      );

      // Calculate remaining trucks to allocate
      const remainingTrucks = requiredTrucks - totalTrucks;

      // Maximum trucks that can be allocated in this group
      const maxAllocatableTrucks = Math.min(
        totalOfferedTrucks,
        remainingTrucks
      );

      // Allocate trucks proportionally based on trucks offered
      let groupTotalAllocated = 0;
      const allocation = [];

      for (const quote of samePriceQuotes) {
        const maxPossible = quote.numberOfTrucks;
        const proportion = maxPossible / totalOfferedTrucks;
        let trucksToAllot = Math.floor(proportion * maxAllocatableTrucks);

        // Ensure we don't allocate more than offered
        trucksToAllot = Math.min(trucksToAllot, maxPossible);

        groupTotalAllocated += trucksToAllot;

        allocation.push({
          quoteId: quote._id,
          label,
          trucksAllotted: trucksToAllot,
          createdAt: quote.createdAt,
          numberOfTrucks: quote.numberOfTrucks,
        });
      }

      // Distribute any remaining trucks within the group
      let trucksRemainingToAllocate =
        maxAllocatableTrucks - groupTotalAllocated;

      if (trucksRemainingToAllocate > 0) {
        // Assign to vendors who can take more trucks, starting from earliest bidder
        allocation
          .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
          .forEach((alloc) => {
            const maxAdditionalTrucks =
              alloc.numberOfTrucks - alloc.trucksAllotted;
            if (maxAdditionalTrucks > 0 && trucksRemainingToAllocate > 0) {
              const additionalTrucks = Math.min(
                maxAdditionalTrucks,
                trucksRemainingToAllocate
              );
              alloc.trucksAllotted += additionalTrucks;
              trucksRemainingToAllocate -= additionalTrucks;
              groupTotalAllocated += additionalTrucks;
            }
          });
      }

      totalTrucks += groupTotalAllocated;

      // Update the quotes in the database
      for (const alloc of allocation) {
        await Quote.findByIdAndUpdate(alloc.quoteId, {
          label: alloc.label,
          trucksAllotted: alloc.trucksAllotted,
        });
      }

      labelCounter++;
    }

    // For any remaining vendors, set label to "-" and trucksAllotted to 0
    while (i < quotes.length) {
      const quote = quotes[i];
      await Quote.findByIdAndUpdate(quote._id, {
        label: "-",
        trucksAllotted: 0,
      });
      i++;
    }
  } catch (error) {
    console.error("Error allocating trucks:", error);
  }
}

// function to send send initial phase emails
async function sendInitialPhaseEmails(rfq) {
  try {
    // notify L1 vendor
    if (rfq.l1VendorId) {
      const l1Vendor = await Vendor.findById(rfq.l1VendorId);
      const emailContent = {
        message: {
          subject: `Congratulations! You are L1 for: ${rfq.RFQNumber}`,
          body: {
            contentType: "Text",
            content: `
              Dear ${l1Vendor.vendorName},
              Congratulations! At the conclusion of the initial bidding phase, you are L1 and have been allotted ${Math.ceil(
                rfq.numberOfVehicles * 0.4
              )} trucks for: ${rfq.RFQNumber}.
              Ensure to abide by your quotation, all deviations will be recorded and used to assess your vendor grade.
              Best regards,
              Team LEAF.
            `,
          },
          toRecipients: [
            {
              emailAddress: {
                address: l1Vendor.email,
              },
            },
          ],
          from: {
            emailAddress: {
              address: SENDER_EMAIL,
            },
          },
        },
      };
      await client.api(`/users/${SENDER_EMAIL}/sendMail`).post(emailContent);
    }

    // notify other vendors
    const initialQuotes = await Quote.find({ rfqId: rfq._id });
    for (const quote of initialQuotes) {
      if (quote.vendorName !== l1Vendor.vendorName) {
        const vendor = await Vendor.findOne({ vendorName: quote.vendorName });
        const emailContent = {
          message: {
            subject: `Update Your Quote for RFQ ${rfq.RFQNumber}`,
            body: {
              contentType: "Text",
              content: `
                Dear ${vendor.vendorName},
                L1 Price is ${rfq.l1Price}. Please log in and update your quote to match it or provide your no-regret price to get your assigned label and truck allocation.
                Best regards,
                Team LEAF
              `,
            },
            toRecipients: [
              {
                emailAddress: {
                  address: vendor.email,
                },
              },
            ],
            from: {
              emailAddress: {
                address: SENDER_EMAIL,
              },
            },
          },
        };
        await client.api(`/users/${SENDER_EMAIL}/sendMail`).post(emailContent);
      }
    }
  } catch (error) {
    console.error("Error sending initial phase emails:", error);
  }
}

// endpoint to finalize RFQ
app.post("/api/rfq/:id/finalize-allocation", async (req, res) => {
  try {
    const { id } = req.params;
    const { logisticsAllocation, finalizeReason } = req.body;

    // Fetch the RFQ
    const rfq = await RFQ.findById(id);
    if (!rfq) {
      return res.status(404).json({ error: "RFQ not found" });
    }

    // Check if RFQ is already closed
    if (rfq.status === "closed") {
      return res.status(400).json({ error: "RFQ has already been finalized." });
    }

    // Fetch all quotes for this RFQ
    const quotes = await Quote.find({ rfqId: id });

    // Compute LEAF Allocation based on quotes
    const assignLeafAllocation = (quotes, requiredTrucks) => {
      if (!requiredTrucks || requiredTrucks <= 0) return [];

      // Sort quotes by price (ascending)
      const sortedQuotes = [...quotes].sort((a, b) => a.price - b.price);
      let totalTrucks = 0;

      return sortedQuotes.map((quote, index) => {
        if (totalTrucks < requiredTrucks) {
          const trucksToAllot = Math.min(
            quote.numberOfTrucks,
            requiredTrucks - totalTrucks
          );
          totalTrucks += trucksToAllot;
          return {
            ...quote.toObject(),
            label: `L${index + 1}`,
            trucksAllotted: trucksToAllot,
          };
        }
        return { ...quote.toObject(), label: "-", trucksAllotted: 0 };
      });
    };

    const leafAllocation = assignLeafAllocation(quotes, rfq.numberOfVehicles);

    // Prepare data for comparison
    const leafAllocData = leafAllocation.map((alloc) => ({
      vendorName: alloc.vendorName,
      trucksAllotted: alloc.trucksAllotted,
    }));
    const logisticsAllocData = logisticsAllocation.map((alloc) => ({
      vendorName: alloc.vendorName,
      trucksAllotted: alloc.trucksAllotted,
    }));

    // Check if Logistics Allocation matches LEAF Allocation
    const isIdentical =
      JSON.stringify(leafAllocData) === JSON.stringify(logisticsAllocData);

    // If there is a mismatch, send email to specified addresses
    if (!isIdentical) {
      // Compute Total LEAF Price and Total Logistics Price
      const totalLeafPrice = leafAllocation.reduce(
        (sum, alloc) => sum + alloc.price * alloc.trucksAllotted,
        0
      );
      const totalLogisticsPrice = logisticsAllocation.reduce(
        (sum, alloc) => sum + alloc.price * alloc.trucksAllotted,
        0
      );

      // Prepare tables for email
      const generateTableHTML = (allocations, title) => {
        let tableRows = allocations
          .map(
            (alloc) => `
          <tr>
            <td>${alloc.vendorName}</td>
            <td>${alloc.price}</td>
            <td>${alloc.trucksAllotted}</td>
            <td>${alloc.label}</td>
          </tr>
        `
          )
          .join("");

        return `
          <h3>${title}</h3>
          <table border="1" cellpadding="5" cellspacing="0">
            <thead>
              <tr>
                <th>Vendor Name</th>
                <th>Price</th>
                <th>Trucks Allotted</th>
                <th>Label</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>
        `;
      };

      const leafAllocationTable = generateTableHTML(
        leafAllocation,
        "LEAF Allocation"
      );
      const logisticsAllocationTable = generateTableHTML(
        logisticsAllocation,
        "Logistics Allocation"
      );

      // Define reasonContent
      const reasonContent = finalizeReason
        ? `<p><strong>Reason given for Difference:</strong> ${finalizeReason}</p>`
        : "";

      const emailContent = {
        message: {
          subject: "Mismatch in Allocation",
          body: {
            contentType: "HTML",
            content: `
              <p>This is a LEAF auto-alert to notify you of a mismatch between LEAF and Logistics Allocation for <strong>${rfq.RFQNumber}</strong>.</p>
              ${leafAllocationTable}
              ${logisticsAllocationTable}
              <p><strong>Total LEAF Price:</strong> ${totalLeafPrice}</p>
              <p><strong>Total Logistics Price:</strong> ${totalLogisticsPrice}</p>
              ${reasonContent}
            `,
          },
          toRecipients: [
            {
              emailAddress: {
                address: "aarnav.singh@premierenergies.com",
              },
            },
            {
              emailAddress: {
                address: "saluja@premierenergies.com",
              },
            },
            {
              emailAddress: {
                address: "vishnu.hazari@premierenergies.com",
              },
            },
          ],
          from: {
            emailAddress: {
              address: SENDER_EMAIL,
            },
          },
        },
      };

      try {
        await client.api(`/users/${SENDER_EMAIL}/sendMail`).post(emailContent);
      } catch (error) {
        console.error("Error sending mismatch email:", error);
      }
    }

    // ***** New code: Send additional sales alert email if price per MW exceeds Budgeted Cost *****
    const totalLogisticsPriceCalculated = logisticsAllocation.reduce(
      (sum, alloc) => sum + alloc.price * alloc.trucksAllotted,
      0
    );
    const mwValue = Number(rfq.mw);
    console.log(
      "Sales Alert Calculation: totalLogisticsPriceCalculated =",
      totalLogisticsPriceCalculated,
      "; rfq.mw =",
      rfq.mw,
      "; mwValue =",
      mwValue
    );
    if (mwValue > 0 && rfq.projectCode) {
      // Look up the SalesOrder using the projectCode field
      const salesOrder = await SalesOrder.findOne({
        projectCode: rfq.projectCode,
      });
      if (salesOrder) {
        // Use the new budgetedPrice field from SalesOrder
        const budgetedCost = Number(salesOrder.budgetedPrice);
        const pricePerMW = ((totalLogisticsPriceCalculated / mwValue)/1000000);
        console.log(
          "Sales Alert Calculation: pricePerMW =",
          pricePerMW,
          "; budgetedCost =",
          budgetedCost
        );
        if (pricePerMW > budgetedCost) {
          console.log(
            "Condition met: pricePerMW (" +
              pricePerMW.toFixed(2) +
              ") exceeds budgetedCost (" +
              budgetedCost +
              "). Sending sales alert email."
          );
          const salesAlertEmail = {
            message: {
              subject: `Alert: ${rfq.RFQNumber} Final Price in INR/Wp Exceeds Budgeted Price`,
              body: {
                contentType: "HTML",
                content: `
              <p>The final price in INR/Wp for ${
                rfq.RFQNumber
              } is ${pricePerMW.toFixed(
                  2
                )}, which exceeds the budgeted cost of ${budgetedCost}.</p>
              <p>Please review the RFQ allocation details.</p>
            `,
              },
              toRecipients: [
                {
                  emailAddress: { address: "aarnav.singh@premierenergies.com" },
                },
              ],
              from: { emailAddress: { address: SENDER_EMAIL } },
            },
          };
          try {
            await client
              .api(`/users/${SENDER_EMAIL}/sendMail`)
              .post(salesAlertEmail);
            console.log("Sales alert email sent successfully.");
          } catch (err) {
            console.error("Error sending sales alert email:", err);
          }
        } else {
          console.log(
            "Condition not met: pricePerMW (" +
              pricePerMW.toFixed(2) +
              ") does not exceed budgetedCost (" +
              budgetedCost +
              "). Sales alert email not sent."
          );
        }
      } else {
        console.log("Sales order not found for project code:", rfq.projectCode);
      }
    } else {
      if (mwValue <= 0) {
        console.log(
          "Invalid MW value (mwValue =",
          mwValue,
          "). Skipping sales alert email."
        );
      }
      if (!rfq.projectCode) {
        console.log(
          "Project code not provided in RFQ. Skipping sales alert email."
        );
      }
    }

    // Update the RFQ status to 'closed' and save the finalizeReason
    rfq.status = "closed";
    if (finalizeReason) {
      rfq.finalizeReason = finalizeReason;
    }
    await rfq.save();

    for (const alloc of logisticsAllocation) {
      // Find the quote
      const quote = await Quote.findOne({
        rfqId: id,
        vendorName: alloc.vendorName,
        
      });
      if (quote) {
        quote.price = alloc.price;
        quote.trucksAllotted = alloc.trucksAllotted;
        quote.label = alloc.label;
        await quote.save();
      }
    }

    // Send emails to vendors with the final allocation
    for (const alloc of logisticsAllocation) {
      if (alloc.trucksAllotted > 0) {
        const vendor = await Vendor.findOne({ vendorName: alloc.vendorName });
        if (vendor) {
          const emailContent = {
            message: {
              subject: `${rfq.RFQNumber} Finalized Allocation`,
              body: {
                contentType: "Text",
                content: `
                  Dear ${vendor.vendorName},
                  The RFQ ${rfq.RFQNumber} has been finalized. Here are your allocation details:
                  Price: ${alloc.price}
                  Trucks Allotted: ${alloc.trucksAllotted}
                  Label: ${alloc.label}
                  Best regards,
                  Team LEAF.
                `,
              },
              toRecipients: [
                {
                  emailAddress: {
                    address: vendor.email,
                  },
                },
              ],
              from: {
                emailAddress: {
                  address: SENDER_EMAIL,
                },
              },
            },
          };
          await client
            .api(`/users/${SENDER_EMAIL}/sendMail`)
            .post(emailContent);
        }
      }
    }

    res.status(200).json({
      message:
        "Allocation finalized and emails sent to vendors and management.",
    });
  } catch (error) {
    console.error("Error finalizing allocation:", error);
    res.status(500).json({ error: "Failed to finalize allocation." });
  }
});

// fetch pending RFQs for a vendor that the vendor has bid on
app.get("/api/vendor-pending-rfqs/:vendorName", async (req, res) => {
  try {
    const { vendorName } = req.params;

    // Fetch quotes where the vendor has been allocated at least one truck
    const vendorQuotes = await Quote.find({
      vendorName,
      trucksAllotted: { $gt: 0 },
    });

    const rfqIds = vendorQuotes.map((quote) => quote.rfqId);

    // Find RFQs that are closed and where the vendor has been allocated trucks
    const rfqs = await RFQ.find({
      _id: { $in: rfqIds },
      status: "closed",
    });

    // For each RFQ, find the vendor's quote and extract necessary details
    const pendingRFQs = await Promise.all(
      rfqs.map(async (rfq) => {
        // Fetch the vendor's quote for this RFQ
        const vendorQuote = vendorQuotes.find(
          (quote) => quote.rfqId.toString() === rfq._id.toString()
        );

        return {
          _id: rfq._id,
          RFQNumber: rfq.RFQNumber,
          label: vendorQuote ? vendorQuote.label : "-",
          trucksAllotted: vendorQuote ? vendorQuote.trucksAllotted : 0,
          originLocation: rfq.originLocation,
          dropLocationState: rfq.dropLocationState,
          dropLocationDistrict: rfq.dropLocationDistrict,
          vehicleType: rfq.vehicleType,
          additionalVehicleDetails: rfq.additionalVehicleDetails,
          vehiclePlacementBeginDate: rfq.vehiclePlacementBeginDate,
          vehiclePlacementEndDate: rfq.vehiclePlacementEndDate,
        };
      })
    );

    res.status(200).json(pendingRFQs);
  } catch (error) {
    console.error("Error fetching pending RFQs for vendor:", error);
    res.status(500).json({ error: "Failed to fetch pending RFQs." });
  }
});
// GET endpoint to fetch all sales orders
app.get("/api/sales/orders", async (req, res) => {
  try {
    const orders = await SalesOrder.find().sort({ createdAt: -1 });
    res.status(200).json(orders);
  } catch (error) {
    console.error("Error fetching sales orders:", error);
    res.status(500).json({ error: "Failed to fetch sales orders" });
  }
});

// Updated endpoint: Get remaining MW for a given Sales Order by projectCode
// Updated endpoint to get remaining MW for a given Sales Order by projectCode
app.get("/api/sales/orders/:projectCode/remaining-mw", async (req, res) => {
  try {
    const { projectCode } = req.params;
    const { override } = req.query; // Get override flag from query params

    // If override flag is true, skip the MW check
    if (override === "true") {
      return res.status(200).json({ remainingMW: "Override enabled, skipping check." });
    }

    // Find the sales order by projectCode
    const salesOrder = await SalesOrder.findOne({ projectCode });
    if (!salesOrder) {
      return res.status(404).json({ error: "Sales order not found" });
    }

    // Sum the MW values of all RFQs that reference this sales order via projectCode
    const rfqs = await RFQ.find({ projectCode: projectCode });
    const usedMW = rfqs.reduce((sum, rfq) => sum + Number(rfq.mw || 0), 0);
    const remainingMW = salesOrder.projectCapacity - usedMW;

    res.status(200).json({ remainingMW });
  } catch (error) {
    console.error("Error calculating remaining MW:", error);
    res.status(500).json({ error: "Failed to calculate remaining MW" });
  }
});


// Updated endpoint to create a new Sales Order using new fields
app.post("/api/sales/orders", async (req, res) => {
  try {
    const {
      customerName,
      projectCapacity,
      siteLocation,
      budgetedPrice,
      projectCode,
    } = req.body;
    if (!customerName || !projectCapacity || !siteLocation || !budgetedPrice) {
      return res.status(400).json({ error: "All fields are required" });
    }
    const newOrder = new SalesOrder({
      customerName,
      projectCapacity,
      siteLocation,
      budgetedPrice,
      projectCode, // For new records, the client sends the computed projectCode.
    });
    await newOrder.save();
    res.status(201).json({ message: "Sales order created successfully" });
  } catch (error) {
    console.error("Error creating sales order:", error);
    res.status(500).json({ error: "Failed to create sales order" });
  }
});

// Endpoint to toggle canOverride flag
// New endpoint to toggle the canOverride flag (index.js)
app.patch("/api/sales/orders/:projectCode/override", async (req, res) => {
  try {
    const { projectCode } = req.params;
    const { canOverride } = req.body;

    // Validate input
    if (typeof canOverride !== "boolean") {
      return res.status(400).json({ error: "canOverride must be a boolean" });
    }

    // Update the sales order
    const salesOrder = await SalesOrder.findOneAndUpdate(
      { projectCode },
      { canOverride },
      { new: true }
    );

    if (!salesOrder) {
      return res.status(404).json({ error: "Sales order not found" });
    }

    res.status(200).json({ message: "Sales order updated", salesOrder });
  } catch (error) {
    console.error("Error updating sales order:", error);
    res.status(500).json({ error: "Failed to update sales order" });
  }
});


// endpoint to update a quote's price and trucks allotted (for factory user)
app.put("/api/quote/factory/:quoteId", async (req, res) => {
  try {
    const { quoteId } = req.params;
    const { price, trucksAllotted } = req.body;

    // Find the quote
    const existingQuote = await Quote.findById(quoteId);
    if (!existingQuote) {
      return res.status(404).json({ error: "Quote not found" });
    }

    // Find the RFQ to check status
    const rfq = await RFQ.findById(existingQuote.rfqId);
    if (!rfq) {
      return res.status(404).json({ error: "RFQ not found" });
    }

    if (rfq.status === "closed") {
      return res
        .status(400)
        .json({ error: "Cannot update quote. RFQ is closed." });
    }

    // Fetch all quotes for the RFQ
    const allQuotes = await Quote.find({ rfqId: rfq._id });

    // Calculate total trucks allotted with the updated value
    const totalTrucksAllotted = allQuotes.reduce((sum, q) => {
      if (q._id.toString() === quoteId) {
        return sum + trucksAllotted;
      }
      return sum + (q.trucksAllotted || 0);
    }, 0);

    if (totalTrucksAllotted > rfq.numberOfVehicles) {
      return res.status(400).json({
        error: `Total trucks allotted (${totalTrucksAllotted}) exceeds required number (${rfq.numberOfVehicles}).`,
      });
    }

    // L1 Constraints
    if (existingQuote.label === "L1") {
      const minL1Trucks = Math.ceil(rfq.numberOfVehicles * 0.39);

      if (price > existingQuote.price) {
        return res.status(400).json({ error: "L1 price cannot be increased." });
      }

      if (trucksAllotted < minL1Trucks) {
        return res.status(400).json({
          error: `L1 trucks allotted cannot be less than 39% of total trucks (${minL1Trucks}).`,
        });
      }
    }

    // Proceed to update the quote
    existingQuote.price = price;
    existingQuote.trucksAllotted = trucksAllotted;
    await existingQuote.save();

    res.status(200).json({
      message: "Quote updated successfully",
      updatedQuote: existingQuote,
    });
  } catch (error) {
    console.error("Error updating quote:", error);
    res.status(500).json({ error: "Failed to update quote" });
  }
});

// fetch all closed RFQs (for all vendors)
{
  /*app.get("/api/closed-rfqs", async (req, res) => {
  try {
    // Fetch all RFQs with status "closed"
    const rfqs = await RFQ.find({ status: "closed" });

    // For each RFQ, fetch all quotes and assign labels and trucks
    const closedRFQs = await Promise.all(
      rfqs.map(async (rfq) => {
        // Fetch all quotes for the current RFQ
        const rfqQuotes = await Quote.find({ rfqId: rfq._id });

        // Assign labels and trucks based on the RFQ requirements
        const labeledQuotes = assignQuoteLabels(
          rfqQuotes,
          rfq.numberOfVehicles
        );

        // Return the RFQ data along with labeled quotes
        return {
          _id: rfq._id,
          RFQNumber: rfq.RFQNumber,
          quotes: labeledQuotes, // Labeled quotes for all vendors
          numberOfVehicles: rfq.numberOfVehicles,
          status: rfq.status,
        };
      })
    );

    res.status(200).json(closedRFQs);
  } catch (error) {
    console.error("Error fetching closed RFQs:", error);
    res.status(500).json({ error: "Failed to fetch closed RFQs." });
  }
}); */
}

// function to send participation reminder emails to selected vendors
async function sendParticipationReminderEmail(rfqId, selectedVendorIds) {
  try {
    const rfq = await RFQ.findById(rfqId);
    if (!rfq) {
      console.error(`RFQ with ID ${rfqId} not found.`);
      return { success: false, message: "RFQ not found" };
    }

    let vendorsToEmail;
    if (selectedVendorIds && selectedVendorIds.length > 0) {
      vendorsToEmail = await Vendor.find(
        { _id: { $in: selectedVendorIds } },
        "email vendorName"
      );
    } else {
      console.log("No selected vendors for participation reminder.");
      return { success: false, message: "No vendors selected" };
    }

    const vendorEmails = vendorsToEmail.map((vendor) => vendor.email);

    if (vendorEmails.length > 0) {
      for (const vendor of vendorsToEmail) {
        const emailContent = {
          message: {
            subject: `Reminder: Participation for ${rfq.RFQNumber}`,
            body: {
              contentType: "HTML",
              content: `
                <p>Dear Vendor,</p>
                <p>This is a reminder to participate in the RFQ process for RFQ Number: <strong>${rfq.RFQNumber}</strong>.</p>
                <p>Please submit your quote at your earliest convenience.</p>
                <p>Best regards,<br/>Team LEAF.</p>
              `,
            },
            toRecipients: [
              {
                emailAddress: {
                  address: vendor.email,
                },
              },
            ],
            from: {
              emailAddress: {
                address: SENDER_EMAIL,
              },
            },
          },
        };
        await client.api(`/users/${SENDER_EMAIL}/sendMail`).post(emailContent);
      }

      selectedVendorIds.forEach((vendorId) => {
        rfq.vendorActions.push({
          action: "reminderSent",
          vendorId,
          timestamp: new Date(),
        });
      });

      await rfq.save();

      return { success: true, message: "Reminder emails sent successfully." };
    } else {
      console.log("No valid email addresses for selected vendors.");
      return {
        success: false,
        message: "No valid email addresses for selected vendors.",
      };
    }
  } catch (error) {
    console.error("Error sending participation reminder emails:", error);
    return { success: false, message: "Failed to send reminder emails." };
  }
}

// Fetch vendor details by username
app.get("/api/vendors/username/:username", async (req, res) => {
  try {
    const { username } = req.params;
    const vendor = await Vendor.findOne({ username });
    if (!vendor) {
      return res.status(404).json({ error: "Vendor not found" });
    }
    res.status(200).json(vendor);
  } catch (error) {
    console.error("Error fetching vendor details:", error);
    res.status(500).json({ error: "Failed to fetch vendor details" });
  }
});

app.post("/api/send-terms-agreement-email", async (req, res) => {
  try {
    const { rfqId, vendorName, vendorEmail, rfqNumber, termsAndConditions } =
      req.body;

    const emailContent = {
      message: {
        subject: `Agreement to Terms and Conditions for ${rfqNumber}`,
        body: {
          contentType: "HTML",
          content: `
            <p>Dear ${vendorName},</p>
            <p>You have agreed to the following terms and conditions for RFQ Number: <strong>${rfqNumber}</strong>:</p>
            <pre>${termsAndConditions}</pre>
            <p>Best regards,<br/>Team LEAF.</p>
          `,
        },
        toRecipients: [
          {
            emailAddress: {
              address: vendorEmail,
            },
          },
        ],
        from: {
          emailAddress: {
            address: SENDER_EMAIL,
          },
        },
      },
    };

    await client.api(`/users/${SENDER_EMAIL}/sendMail`).post(emailContent);

    res.status(200).json({ message: "Agreement email sent successfully." });
  } catch (error) {
    console.error("Error sending agreement email:", error);
    res.status(500).json({ error: "Failed to send agreement email." });
  }
});

app.get("/api/md/top-vendors", async (req, res) => {
  try {
    const topVendors = await Quote.aggregate([
      {
        $group: {
          _id: "$vendorName",
          totalTrucksAllotted: { $sum: "$trucksAllotted" },
        },
      },
      {
        $sort: { totalTrucksAllotted: -1 },
      },
      {
        $limit: 5,
      },
      {
        $project: {
          vendorName: "$_id",
          totalTrucksAllotted: 1,
          _id: 0,
        },
      },
    ]);

    res.status(200).json(topVendors);
  } catch (error) {
    console.error("Error fetching top vendors data:", error);
    res.status(500).json({ error: "Failed to fetch data" });
  }
});

// api endpoint for geographical distribution data
app.get("/api/md/geographical-distribution", async (req, res) => {
  try {
    const { state } = req.query;

    if (state) {
      // Return district-level data for the specified state
      const data = await RFQ.aggregate([
        { $match: { dropLocationState: state } },
        {
          $group: {
            _id: "$dropLocationDistrict",
            count: { $sum: 1 },
          },
        },
        {
          $project: {
            district: "$_id",
            count: 1,
            _id: 0,
          },
        },
      ]);
      res.status(200).json(data);
    } else {
      // Return state-level data
      const data = await RFQ.aggregate([
        {
          $group: {
            _id: "$dropLocationState",
            count: { $sum: 1 },
          },
        },
        {
          $project: {
            state: "$_id",
            count: 1,
            _id: 0,
          },
        },
      ]);
      res.status(200).json(data);
    }
  } catch (error) {
    console.error("Error fetching geographical distribution data:", error);
    res.status(500).json({ error: "Failed to fetch data" });
  }
});

//const locationCoordinates = require('./locationCoordinates.js');

//app.get('/api/md/geographical-distribution', async (req, res) => {
//try {
//const data = await RFQ.aggregate([
//{
//$group: {
//_id: {
//origin: '$originLocation',
//destination: '$dropLocationDistrict',
//},
//count: { $sum: 1 },
//},
//},
//{
//$project: {
//origin: '$_id.origin',
//destination: '$_id.destination',
//count: 1,
//_id: 0,
//},
//    },
//    ]);

//const dataWithCoordinates = data.map(item => {
//    const originCoords = locationCoordinates[item.origin];
//      const destCoords = locationCoordinates[item.destination];

//if (!originCoords || !destCoords) {
//    console.warn(`Coordinates not found for locations: ${item.origin} or ${item.destination}`);
//      return null;
//      }

//return {
//origin: item.origin,
//destination: item.destination,
//count: item.count,
//originLatitude: originCoords.latitude,
//originLongitude: originCoords.longitude,
//  destinationLatitude: destCoords.latitude,
//    destinationLongitude: destCoords.longitude,
//    };
//    }).filter(item => item !== null);

// res.status(200).json(dataWithCoordinates);
// } catch (error) {
//console.error('Error fetching geographical distribution data:', error);
// res.status(500).json({ error: 'Failed to fetch data' });
// }
//});

// Endpoint to handle contact form submissions
app.post("/api/contact", async (req, res) => {
  const { name, contactNumber, companyName, message } = req.body;

  // Basic validation
  if (!name || !contactNumber || !companyName || !message) {
    return res.status(400).json({ error: "All fields are required." });
  }

  try {
    // Email content
    const emailContent = {
      message: {
        subject: "New Contact Form Submission",
        body: {
          contentType: "HTML",
          content: `
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Contact Number:</strong> ${contactNumber}</p>
            <p><strong>Company Name:</strong> ${companyName}</p>
            <p><strong>Message:</strong></p>
            <p>${message}</p>
          `,
        },
        toRecipients: [
          {
            emailAddress: {
              address: "leaf@premierenergies.com",
            },
          },
          {
            emailAddress: {
              address: "aarnav.singh@premierenergies.com",
            },
          },
        ],
        from: {
          emailAddress: {
            address: SENDER_EMAIL,
          },
        },
      },
    };

    // Send the email using Microsoft Graph API
    await client.api(`/users/${SENDER_EMAIL}/sendMail`).post(emailContent);

    res
      .status(200)
      .json({ success: true, message: "Email sent successfully." });
  } catch (error) {
    console.error("Error sending email:", error);
    res
      .status(500)
      .json({ error: "An error occurred while sending the email." });
  }
});

// endpoint for sending participation reminder emails
app.post("/api/send-reminder", async (req, res) => {
  const { rfqId, vendorIds } = req.body;

  try {
    const emailResponse = await sendParticipationReminderEmail(
      rfqId,
      vendorIds
    );
    if (emailResponse.success) {
      res.status(200).json({ message: emailResponse.message });
    } else {
      res.status(500).json({ message: emailResponse.message });
    }
  } catch (error) {
    console.error("Error in send-reminder endpoint:", error);
    res.status(500).json({ message: "Failed to send participation reminder." });
  }
});

app.get("/api/md/savings-achieved", async (req, res) => {
  try {
    const rfqs = await RFQ.find();

    const data = rfqs.map((rfq) => {
      const budgetedCost = rfq.budgetedPriceBySalesDept * rfq.numberOfVehicles;
      const actualCost = rfq.l1Price ? rfq.l1Price * rfq.numberOfVehicles : 0;
      const savings = budgetedCost - actualCost;

      return {
        date: rfq.createdAt.toISOString(),
        savings: savings > 0 ? savings : 0,
      };
    });

    res.status(200).json(data);
  } catch (error) {
    console.error("Error fetching savings achieved data:", error);
    res.status(500).json({ error: "Failed to fetch data" });
  }
});

// Transportation Costs Endpoint
app.get("/api/md/transportation-costs", async (req, res) => {
  try {
    const rfqs = await RFQ.find();

    const data = rfqs.map((rfq) => {
      const totalBudgetedCost =
        rfq.budgetedPriceBySalesDept * rfq.numberOfVehicles;
      const totalActualCost = rfq.l1Price
        ? rfq.l1Price * rfq.numberOfVehicles
        : 0;

      return {
        date: rfq.createdAt,
        budgetedCost: totalBudgetedCost,
        actualCost: totalActualCost,
      };
    });

    res.status(200).json(data);
  } catch (error) {
    console.error("Error fetching transportation costs:", error);
    res.status(500).json({ error: "Failed to fetch data" });
  }
});

app.get("/api/md/vendor-participation", async (req, res) => {
  try {
    const { vendorName } = req.query;

    let data = [];

    if (vendorName && vendorName !== "all") {
      // Step 1: Find all RFQs where the vendor was invited
      const invitedRFQs = await RFQ.find({ selectedVendors: vendorName });
      const totalInvited = invitedRFQs.length;

      // Step 2: Check how many of those RFQs have quotes from this vendor
      const invitedRFQIds = invitedRFQs.map((rfq) => rfq._id);
      const totalParticipated = await Quote.countDocuments({
        rfqId: { $in: invitedRFQIds },
        vendorName: vendorName,
      });

      // If no invited RFQs, ensure we respond appropriately
      if (totalInvited === 0) {
        data = [
          { status: "Participated", count: 0 },
          { status: "Not Participated", count: 0 },
        ];
      } else {
        data = [
          { status: "Participated", count: totalParticipated },
          {
            status: "Not Participated",
            count: Math.max(totalInvited - totalParticipated, 0),
          },
        ];
      }
    } else {
      // Cumulative participation data for all vendors
      const totalInvitedResult = await RFQ.aggregate([
        { $unwind: "$selectedVendors" },
        { $group: { _id: null, count: { $sum: 1 } } },
      ]);

      const totalInvited = totalInvitedResult[0]
        ? totalInvitedResult[0].count
        : 0;

      // Count distinct vendors that submitted quotes
      const totalParticipated = await Quote.distinct(
        "vendorName"
      ).countDocuments();

      data = [
        { status: "Participated", count: totalParticipated },
        {
          status: "Not Participated",
          count: Math.max(totalInvited - totalParticipated, 0),
        },
      ];
    }

    console.log("Vendor Participation Data:", data); // Debugging line
    res.status(200).json(data);
  } catch (error) {
    console.error("Error fetching vendor participation data:", error);
    res.status(500).json({ error: "Failed to fetch data" });
  }
});

app.get("/api/md/vendors", async (req, res) => {
  try {
    const vendors = await Quote.distinct("vendorName");
    res.status(200).json(vendors);
  } catch (error) {
    console.error("Error fetching vendor list:", error);
    res.status(500).json({ error: "Failed to fetch vendors" });
  }
});

// Add this endpoint to handle individual LR number submissions
app.post("/api/vendor/rfq/:rfqId/submit-lr-number", async (req, res) => {
  try {
    const { rfqId } = req.params;
    const { username: vendorName, index, lrNumber } = req.body;

    // Validate index and lrNumber
    if (
      index === undefined ||
      lrNumber === undefined ||
      lrNumber.trim() === ""
    ) {
      return res.status(400).json({ error: "Invalid index or LR Number." });
    }

    // Fetch the vendor's quote
    const vendorQuote = await Quote.findOne({
      rfqId,
      vendorName,
    });

    if (!vendorQuote || vendorQuote.trucksAllotted <= 0) {
      return res.status(400).json({
        error: "No trucks allotted to this vendor for this RFQ.",
      });
    }

    // Fetch or create the LRNumber entry
    let lrNumberEntry = await LRNumber.findOne({
      rfqId,
      vendorName,
    });

    if (!lrNumberEntry) {
      lrNumberEntry = new LRNumber({
        rfqId,
        vendorName,
        lrNumbers: Array(vendorQuote.trucksAllotted).fill(""),
      });
    }

    // Update the specific LR number at the given index
    lrNumberEntry.lrNumbers[index] = lrNumber;
    await lrNumberEntry.save();

    res.status(200).json({ message: "LR Number submitted successfully." });
  } catch (error) {
    console.error("Error submitting LR Number:", error);
    res.status(500).json({ error: "Failed to submit LR Number." });
  }
});

// api endpoint for key metrics
app.get("/api/md/key-metrics", async (req, res) => {
  try {
    const totalRFQs = await RFQ.countDocuments();
    const totalSavingsData = await RFQ.aggregate([
      {
        $project: {
          savings: {
            $subtract: [
              { $multiply: ["$budgetedPriceBySalesDept", "$numberOfVehicles"] },
              { $multiply: ["$l1Price", "$numberOfVehicles"] },
            ],
          },
        },
      },
      { $group: { _id: null, totalSavings: { $sum: "$savings" } } },
    ]);

    const totalSavings = totalSavingsData[0]
      ? totalSavingsData[0].totalSavings
      : 0;

    const totalCostData = await RFQ.aggregate([
      { $match: { l1Price: { $exists: true } } },
      {
        $group: {
          _id: null,
          totalCost: { $sum: { $multiply: ["$l1Price", "$numberOfVehicles"] } },
          totalShipments: { $sum: "$numberOfVehicles" },
        },
      },
    ]);

    const totalCost = totalCostData[0] ? totalCostData[0].totalCost : 0;
    const totalShipments = totalCostData[0]
      ? totalCostData[0].totalShipments
      : 0;
    const averageCostPerShipment = totalShipments
      ? totalCost / totalShipments
      : 0;

    res.status(200).json({
      totalRFQs,
      totalSavings,
      averageCostPerShipment,
    });
  } catch (error) {
    console.error("Error fetching key metrics:", error);
    res.status(500).json({ error: "Failed to fetch key metrics" });
  }
});

// function to check and update RFQ status based on the closing date and time
const updateRFQStatuses = async () => {
  try {
    const now = moment().tz("Asia/Kolkata");
    const rfqs = await RFQ.find();

    for (const rfq of rfqs) {
      if (rfq.status === "initial" && now.isAfter(rfq.initialQuoteEndTime)) {
        // transition from 'initial' to 'evaluation'
        rfq.status = "evaluation";

        // assign labels and trucks based on initial quotes
        await assignInitialLabelsAndTrucks(rfq);

        // notify vendors
        await sendInitialPhaseEmails(rfq);

        await rfq.save();
      } else if (
        rfq.status === "evaluation" &&
        now.isAfter(rfq.evaluationEndTime)
      ) {
        // transition from 'evaluation' to 'closed'
        rfq.status = "closed";
        await rfq.save();
      }
    }
  } catch (error) {
    console.error("Error updating RFQ statuses:", error);
  }
};

// schedule the status updates
cron.schedule("* * * * *", updateRFQStatuses);

// function to send reminder emails to vendors
{
  /*async function sendReminderEmails() {
  const now = new Date();
  console.log(`Cron job started at ${now.toISOString()}`);

  try {
    const targetTime = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const rfqs = await RFQ.find({ eReverseDate: { $lte: targetTime } });

    console.log(`Found ${rfqs.length} RFQs requiring email notification.`);

    // get the access token and initialize transporter inside the function
    const accessTokenResponse = await oAuth2Client.getAccessToken();
    const accessToken = accessTokenResponse.token;

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        type: "OAuth2",
        user: "aarnavsingh836@gmail.com",
        clientId: CLIENT_ID,
        clientSecret: CLIENT_SECRET,
        refreshToken: REFRESH_TOKEN,
        accessToken: accessToken,
      },
    });

    // iterate over each RFQ
    for (const rfq of rfqs) {
      const quotes = await Quote.find({ rfqId: rfq._id });
      console.log(
        `Processing ${quotes.length} quotes for RFQ ${rfq.RFQNumber}`
      );

      // assign labels and trucks to the quotes
      const labeledQuotes = assignQuoteLabels(quotes, rfq.numberOfVehicles);

      // send an email to each vendor
      for (const labeledQuote of labeledQuotes) {
        console.log(`Processing labeledQuote:`, labeledQuote);

        // log the vendorName being used in the query
        console.log(
          `Searching for vendor with name: ${labeledQuote.vendorName}`
        );

        // add validation to ensure vendorName is not undefined or null
        if (!labeledQuote.vendorName) {
          console.error("vendorName is undefined or null!");
          continue;
        }

        // find the vendor by vendorName
        const vendor = await Vendor.findOne({
          vendorName: labeledQuote.vendorName,
        });

        // check if the vendor is found
        if (vendor) {
          // email options
          const mailOptions = {
            from: "aarnavsingh836@gmail.com",
            to: vendor.email,
            subject: `RFQ ${rfq.RFQNumber} Status Update`,
            text: `
              Dear ${labeledQuote.vendorName},

              Your status for RFQ ${rfq.RFQNumber} is ${labeledQuote.label}.
              The number of trucks allotted to you is ${
                labeledQuote.actualTrucksAllotted
              }.

              Please be ready for the e-reverse process at:
              Date: ${rfq.eReverseDate.toDateString()}
              Time: ${rfq.eReverseTime}

              Best regards,
              Team LEAF.
            `,
          };

          // send the email
          try {
            await transporter.sendMail(mailOptions);
            console.log(
              `Email sent to ${labeledQuote.vendorName} (${vendor.email})`
            );
          } catch (error) {
            // log an error if the email sending fails
            console.error(
              `Failed to send email to ${labeledQuote.vendorName} (${vendor.email}):`,
              error
            );
          }
        }
        // log an error if the vendor is not found
        else {
          console.error(
            `No vendor found with name: ${labeledQuote.vendorName}`
          );
        }
      }
    }
  } catch (error) {
    // log an error if the cron job fails
    console.error("Error during the cron job execution:", error);
  }
} */
}

// schedule the job to run every minute for testing
//cron.schedule("*/720 * * * *", () => {
//  console.log("Cron job execution triggered
//  sendReminderEmails();
//});

// console.log("Cron job scheduled to run every minute

// Serve static files from the React app
//app.use(express.static(path.join(__dirname, 'dist')));

// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
//app.get('*', (req, res) => {
//  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
//});

app.get("/api/md/vehicle-type-details-split", async (req, res) => {
  try {
    // Step 1: Aggregate RFQs by vehicleType + additionalVehicleDetails
    const aggregatedData = await RFQ.aggregate([
      {
        $group: {
          _id: {
            vehicleType: "$vehicleType",
            additionalVehicleDetails: "$additionalVehicleDetails",
          },
          count: { $sum: 1 },
        },
      },
    ]);

    // Step 2: Calculate the total count of all RFQs in this aggregation
    const totalRFQs = aggregatedData.reduce((acc, item) => acc + item.count, 0);

    // Step 3: Map the aggregated data to an array with vehicleType, additionalVehicleDetails, count, and percentage
    const result = aggregatedData.map((item) => {
      const { vehicleType, additionalVehicleDetails } = item._id;
      return {
        vehicleType: vehicleType || "Unknown",
        additionalVehicleDetails: additionalVehicleDetails || "N/A",
        count: item.count,
        percentage: totalRFQs
          ? ((item.count / totalRFQs) * 100).toFixed(2)
          : "0.00",
      };
    });

    // Step 4: Return the result
    res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching vehicle type + details split:", error);
    res
      .status(500)
      .json({ error: "Failed to fetch vehicle type + details split" });
  }
});

app.get("/api/md/geographical-distribution-by-district", async (req, res) => {
  try {
    // Step 1: Aggregate RFQs by dropLocationState and dropLocationDistrict
    const aggregatedData = await RFQ.aggregate([
      {
        $group: {
          _id: {
            state: "$dropLocationState",
            district: "$dropLocationDistrict",
          },
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          state: "$_id.state",
          district: "$_id.district",
          count: 1,
          _id: 0,
        },
      },
    ]);

    // Step 2: Group the aggregated results by state for a cleaner nested structure
    // e.g. { state: 'X', districts: [{ district: 'Y', count: n }, ... ] }
    const groupedByState = {};
    aggregatedData.forEach((item) => {
      const { state, district, count } = item;
      if (!groupedByState[state]) {
        groupedByState[state] = [];
      }
      groupedByState[state].push({ district, count });
    });

    // Step 3: Transform the object into an array if you prefer array-based response
    // Each element will have the shape:
    // {
    //   state: "XYZ",
    //   districts: [
    //     { district: "ABC", count: 10 },
    //     { district: "DEF", count: 7 },
    //   ]
    // }
    const result = Object.entries(groupedByState).map(([state, districts]) => ({
      state,
      districts,
    }));

    res.status(200).json(result);
  } catch (error) {
    console.error(
      "Error fetching state-district geographical distribution:",
      error
    );
    res.status(500).json({
      error: "Failed to fetch state-district geographical distribution",
    });
  }
});

app.get("/api/md/monthly-vehicles", async (req, res) => {
  try {
    // 1) Only match documents that have a valid numberOfVehicles.
    //    If you want to ignore documents with 0 vehicles, do { $gt: 0 }
    const aggregatedData = await RFQ.aggregate([
      {
        $match: {
          numberOfVehicles: { $exists: true, $gte: 1 },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          totalVehicles: { $sum: "$numberOfVehicles" },
        },
      },
      {
        $sort: {
          "_id.year": 1,
          "_id.month": 1,
        },
      },
    ]);

    // DEBUG: Log the raw aggregatedData to see if there's anything.
    console.log("aggregatedData =>", aggregatedData);

    // 2) Map the data into { month: 'Jan 2024', vehicles: 123 }
    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    const results = aggregatedData.map((item) => {
      const { month, year } = item._id;
      const monthString = `${monthNames[month - 1]} ${year}`;
      return {
        month: monthString,
        vehicles: item.totalVehicles,
      };
    });

    // DEBUG: Log the final results
    console.log("final monthOverMonth results =>", results);

    res.status(200).json(results);
  } catch (error) {
    console.error("Error fetching month-over-month vehicles data:", error);
    res.status(500).json({ error: "Failed to fetch month-over-month data" });
  }
});

app.post("/api/fastag-tracking", async (req, res) => {
  try {
    const { vehiclenumber } = req.body;

    // 1) First, get a fresh token from Masters India Auth API:
    const authPayload = {
      username: "aarnav.singh@premierenergies.com", // Provided user ID
      password: "Masters@4321", // Provided password
    };

    const authResponse = await axios.post(
      "https://api-platform.mastersindia.co/api/v2/token-auth/",
      authPayload,
      {
        headers: {
          Accept: "application/json",
        },
      }
    );

    // The auth API typically returns { token: "<JWT>" } on success
    const token = authResponse.data.token;
    if (!token) {
      return res
        .status(500)
        .json({ error: "No token returned from Masters India Auth" });
    }

    // 2) Now call the FASTAG API using the fresh token:
    const config = {
      headers: {
        Authorization: `JWT ${token}`, // use the dynamic token from auth
        Productid: "arap",
        Subid: "226958", // Provided subid
        Mode: "Buyer",
        "Content-Type": "application/json",
      },
    };

    const apiBody = {
      vehiclenumber, // e.g. "HR55AL1020"
    };

    const fastagResponse = await axios.post(
      "https://api-platform.mastersindia.co/api/v2/sbt/FASTAG/",
      apiBody,
      config
    );

    // Send Masters India’s FASTAG data back to the frontend
    return res.status(200).json(fastagResponse.data);
  } catch (error) {
    console.error("Error calling FASTAG API:", error);

    // Return more specific errors if available
    if (error.response) {
      return res
        .status(error.response.status)
        .json({ error: error.response.data || "Masters India error" });
    } else if (error.request) {
      return res.status(500).json({ error: "No response from Masters India" });
    }
    return res.status(500).json({ error: "Internal server error" });
  }
});

// start server
const PORT = process.env.PORT || 7707;

server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
