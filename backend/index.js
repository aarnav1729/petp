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

// create express app
const app = express();
const server = http.createServer(app);

// create socket.io server
const io = new Server(server, {
  cors: {
    origin: "https://petp-alpha.vercel.app/",
    methods: ["GET", "POST", "PUT"],
  },
});

// middleware
app.use(cors());
app.use(express.json());

// socket.io configuration
io.on("connection", (socket) => {
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
});

// connect to monogdb
mongoose
  .connect(
    "mongodb+srv://aarnavsingh836:Cucumber1729@rr.oldse8x.mongodb.net/?retryWrites=true&w=majority&appName=rr",
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  )
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Oauth2 client setup
const CLIENT_ID =
  "146143405091-si7f6sctcsjmcnkvc0o6tvukqaallcop.apps.googleusercontent.com";
const CLIENT_SECRET = "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";
const REDIRECT_URI = "https://developers.google.com/oauthplayground";
const REFRESH_TOKEN =
  "1//04fJkb44IIJmZCgYIARAAGAQSNwF-L9Ir-S522XB9rNyof_tXH5GsDOEZbKqkVKWI4lffSF4TTat5sJJH86o1U2bvgDxtBhXXMJU";
const oAuth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);
oAuth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });

// function to send email on rfq creation
async function sendRFQEmail(rfqData, selectedVendorIds) {
  try {
    let vendorsToEmail;

    if (selectedVendorIds && selectedVendorIds.length > 0) {
      // Fetch only the selected vendors
      vendorsToEmail = await Vendor.find(
        { _id: { $in: selectedVendorIds } },
        "email vendorName"
      );
    } else {
      // Default to no vendors if none were selected
      vendorsToEmail = [];
    }

    const vendorEmails = vendorsToEmail.map((vendor) => vendor.email);

    if (vendorEmails.length > 0) {
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

      const mailOptions = {
        from: "aarnavsingh836@gmail.com",
        to: vendorEmails.join(", "),
        subject: "New RFQ Posted",
        html: `
          <p>Dear Vendor,</p>
          <p>We are pleased to inform you that a new RFQ has been posted. Below are the details:</p>
          <table border="1" cellpadding="5" cellspacing="0" style="border-collapse: collapse; inline-size: 100%;">
            <thead>
              <tr>
                <th style="background-color: #f2f2f2;">Field</th>
                <th style="background-color: #f2f2f2;">Value</th>
              </tr>
            </thead>
            <tbody>
              ${Object.entries(rfqData)
                .map(
                  ([key, value]) => `
                <tr>
                  <td style="padding: 8px; text-align: start;">${key.replace(
                    /([A-Z])/g,
                    " $1"
                  )}</td>
                  <td style="padding: 8px; text-align: start;">${value}</td>
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>
          <p>We look forward to receiving your quote.</p>
          <p>Best regards,<br/>Premier Energies Limited</p>
        `,
      };
      await transporter.sendMail(mailOptions);
      console.log("Emails sent to selected vendors.");
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

// vendor schema and model
const vendorSchema = new mongoose.Schema({
  username: { type: String, unique: true },
  vendorName: { type: String, unique: true },
  password: String,
  email: { type: String, unique: true, required: true },
  contactNumber: { type: String, unique: true, required: true },
});

const Vendor = mongoose.model("Vendor", vendorSchema);

// quote schema and model
const quoteSchema = new mongoose.Schema({
  rfqId: { type: mongoose.Schema.Types.ObjectId, ref: "RFQ" },
  vendorName: String,
  price: Number,
  message: String,
  numberOfTrucks: Number,
  validityPeriod: String,
});

const Quote = mongoose.model("Quote", quoteSchema);

// user schema and model
const userSchema = new mongoose.Schema({
  username: { type: String, unique: true },
  password: String,
  email: { type: String, unique: true, required: true },
  contactNumber: { type: String, unique: true, required: true },
  role: { type: String, enum: ["vendor", "factory"], required: true },
  status: { type: String, enum: ["pending", "approved"], default: "pending" },
});

const User = mongoose.model("User", userSchema);

// rfq schema and model
const rfqSchema = new mongoose.Schema({
  RFQNumber: String,
  shortName: String,
  companyType: String,
  sapOrder: String,
  itemType: String,
  customerName: String,
  originLocation: String,
  dropLocationState: String,
  dropLocationDistrict: String,
  vehicleType: String,
  additionalVehicleDetails: String,
  numberOfVehicles: Number,
  weight: String,
  budgetedPriceBySalesDept: Number,
  maxAllowablePrice: Number,
  eReverseDate: { type: Date, required: false },
  eReverseTime: { type: String, required: false },
  vehiclePlacementBeginDate: Date,
  vehiclePlacementEndDate: Date,
  status: { type: String, enum: ["open", "closed"], default: "open" },
  RFQClosingDate: Date,
  RFQClosingTime: { type: String, required: true },
  eReverseToggle: { type: Boolean, default: false },
  rfqType: { type: String, enum: ["Long Term", "D2D"], default: "D2D" },
  selectedVendors: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Vendor' }],
});

const RFQ = mongoose.model("RFQ", rfqSchema);

// api endpoints

// endpoint for logging in
app.post("/api/login", async (req, res) => {
  const { username, password, role } = req.body;

  // check if the role is admin
  if (role === "admin") {
    // check if the admin credentials are correct
    if (username === "admin" && password === "admin") {
      // return success response
      return res.status(200).json({ success: true });
    } else {
      // return error response
      return res
        .status(401)
        .json({ success: false, message: "Invalid admin credentials" });
    }
  }

  // check if the role is vendor
  try {
    const user = await User.findOne({ username, password, role });

    if (user) {
      if (user.status === "approved") {
        return res.status(200).json({ success: true, username: user.username });
      } else {
        return res
          .status(403)
          .json({ success: false, message: "Account pending admin approval" });
      }
    } else {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
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

    // Send account approval email
    const mailOptions = {
      from: "aarnavsingh836@gmail.com",
      to: user.email,
      subject: "Account Approved",
      text: `
        Dear ${user.username},

        Congratulations! Your account has been approved by the admin.
        You can now log in to the portal using your credentials.

        Best regards,
        Premier Energies Team
      `,
    };

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

    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: "User account approved and email sent." });
  } catch (error) {
    console.error("Error approving user account:", error);
    res.status(500).json({ error: "Failed to approve user account" });
  }
});

// endpoint for fetching active auctions
app.get("/api/active-auctions", async (req, res) => {
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
});

// endpoint for vendor registration
app.post("/api/register", async (req, res) => {
  // extract the required fields from the request body
  const { username, password, vendorName, email, contactNumber, role } =
    req.body;

  // check if the username, password, vendorName, email, and contact number are provided
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

    // send the welcome email
    const mailOptions = {
      from: "aarnavsingh836@gmail.com",
      to: email,
      subject: "Welcome to Premier Energies",
      text: `
        Dear ${username},

        Welcome to LEAF by Premier Energies! We're excited to have you onboard.

        Here are your login credentials:
        Username: ${username}
        Password: ${password}

        Thank you for registering with us! Your account is currently pending admin approval.
        You will be notified once your account has been approved.

        Best regards,
        Premier Energies Team
      `,
    };

    // send the email using OAuth2
    const accessTokenResponse = await oAuth2Client.getAccessToken();
    const accessToken = accessTokenResponse.token;

    // create the transporter instance
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

    // send the email
    await transporter.sendMail(mailOptions);

    // return success response
    res.status(201).json({
      success: true,
      message: "User registered successfully and welcome email sent.",
    });
  } catch (error) {
    // log error if vendor registration fails
    console.error("Error registering vendor:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to register vendor." });
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

    // Also create a User entry
    const newUser = new User({
      username,
      password,
      email,
      contactNumber,
      role: "vendor",
      status: "approved",
    });

    await newUser.save();

    // send the welcome email (if needed)
    const mailOptions = {
      from: "aarnavsingh836@gmail.com",
      to: email,
      subject: "Welcome to Leaf",
      text: `
          Dear ${username},
    
          Welcome to LEAF! We're excited to have you onboard.
    
          Here are your login credentials:
            Username: ${username}
            Password: ${password}
    
        Thank you for registering with us! Your account is currently pending admin approval.
        You will be notified once your account has been approved.
    
          Best regards,
          Project Leaf Team,
          Premier Energies!
        `,
    };

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

    await transporter.sendMail(mailOptions);

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
      status: "open",
      selectedVendors: req.body.selectedVendors,
    };

    // Create a new RFQ with the generated number
    const rfq = new RFQ(newRFQData);
    await rfq.save();

    // Send email to vendors
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
    } = req.body;

    // save quote with vendorName
    const newQuote = new Quote({
      rfqId,
      vendorName,
      price: quote,
      numberOfTrucks,
      validityPeriod,
      message,
    });
    await newQuote.save();

    const adminEmail = "aarnavsingh836@gmail.com";

    const mailOptions = {
      from: "aarnavsingh836@gmail.com",
      to: adminEmail,
      subject: "New Quote Submitted",
      text: `A new quote has been submitted for RFQ ID: ${rfqId}\nVendor: ${vendorName}\nQuote: ${quote}\nValidity Period: ${validityPeriod}\nMessage: ${message}`,
    };

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

    await transporter.sendMail(mailOptions);

    res
      .status(200)
      .json({ message: "Quote submitted and email sent to admin" });
  } catch (error) {
    console.error("Error submitting quote:", error);
    res.status(500).json({ error: "Failed to submit quote" });
  }
});

// endpoint to update an existing quote
app.put("/api/quote/:quoteId", async (req, res) => {
  try {
    const { quoteId } = req.params;
    const { rfqId, quote, message, vendorName, numberOfTrucks } = req.body;

    // find the quote by ID and update it
    const updatedQuote = await Quote.findByIdAndUpdate(
      quoteId,
      {
        rfqId,
        vendorName,
        price: quote,
        numberOfTrucks,
        validityPeriod,
        message,
      },
      { new: true } // return the updated document
    );

    if (!updatedQuote) {
      return res.status(404).json({ error: "Quote not found" });
    }

    const adminEmail = "aarnavsingh836@gmail.com";
    const mailOptions = {
      from: "aarnavsingh836@gmail.com",
      to: adminEmail,
      subject: "Quote Updated",
      text: `A quote has been updated for RFQ ID: ${rfqId}\nVendor: ${vendorName}\nQuote: ${quote}\nValidity Period: ${validityPeriod}\nMessage: ${message}`,
    };

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

    await transporter.sendMail(mailOptions);

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

    // Ensure that the ID is valid for MongoDB ObjectID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid RFQ ID" });
    }

    const rfq = await RFQ.findById(id).populate('selectedVendors');
    if (!rfq) {
      return res.status(404).json({ error: "RFQ not found" });
    }

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

    // Update the selectedVendors list
    const existingVendorIds = rfq.selectedVendors.map((vendorId) => vendorId.toString());
    const newVendorIds = vendorIds.filter((vendorId) => !existingVendorIds.includes(vendorId));

    rfq.selectedVendors = rfq.selectedVendors.concat(newVendorIds);
    await rfq.save();

    // Send RFQ email to the newly added vendors
    const emailResponse = await sendRFQEmail(rfq, newVendorIds);

    if (!emailResponse.success) {
      return res.status(500).json({ message: "Failed to send emails to added vendors." });
    }

    res.status(200).json({ message: "Vendors added and emails sent successfully." });
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
    res.status(500).json({ error: "Failed to fetch factory users", details: error.message });
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

    // send the welcome email (if needed)
    const mailOptions = {
      from: "aarnavsingh836@gmail.com",
      to: email,
      subject: "Welcome to Leaf",
      text: `
          Dear ${username},
    
          Welcome to LEAF by Premier Energies! We're excited to have you onboard.
    
          Here are your login credentials:
            Username: ${username}
            Password: ${password}
    
        Thank you for registering with us! Your account is currently pending admin approval.
        You will be notified once your account has been approved.
    
          Best regards,
          Premier Energies Team
        `,
    };

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

    await transporter.sendMail(mailOptions);

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

// endpoint to delete a vendor by ID
app.delete("/api/vendors/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const vendor = await Vendor.findByIdAndDelete(id);

    if (!vendor) {
      return res.status(404).json({ error: "Vendor not found" });
    }

    // Also delete from User collection
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
const assignQuoteLabels = (quotes, requiredTrucks) => {
  if (!requiredTrucks || requiredTrucks <= 0) return quotes; // Ensure `requiredTrucks` is valid

  const sortedQuotes = [...quotes].sort((a, b) => a.price - b.price); // Sort by price ascending
  let totalTrucks = 0;

  return sortedQuotes.map((quote, index) => {
    if (totalTrucks < requiredTrucks) {
      const trucksAllotted = Math.min(
        quote.numberOfTrucks,
        requiredTrucks - totalTrucks
      );
      totalTrucks += trucksAllotted;
      return {
        ...quote._doc, // Ensure all fields from the original quote are included
        label: `L${index + 1}`,
        actualTrucksAllotted: trucksAllotted,
      };
    }
    return {
      ...quote._doc,
      label: "-",
      actualTrucksAllotted: 0,
    };
  });
};

// fetch pending RFQs for a vendor that the vendor has bid on
app.get("/api/vendor-pending-rfqs/:vendorName", async (req, res) => {
  try {
    const { vendorName } = req.params;

    // Fetch quotes where the vendor has participated
    const quotes = await Quote.find({ vendorName });
    const rfqIds = quotes.map((quote) => quote.rfqId);

    // Find RFQs based on the fetched RFQ IDs
    const rfqs = await RFQ.find({
      _id: { $in: rfqIds },
      status: { $ne: "completed" }, // Exclude RFQs marked as "completed"
    });

    // Fetch all quotes for these RFQs and assign labels and trucks
    const pendingRFQs = await Promise.all(
      rfqs.map(async (rfq) => {
        // Fetch all quotes for the current RFQ
        const rfqQuotes = await Quote.find({ rfqId: rfq._id });

        // Assign labels to the quotes
        const labeledQuotes = assignQuoteLabels(
          rfqQuotes,
          rfq.numberOfVehicles
        );

        // Find the vendor's quote from the labeled quotes
        const vendorQuote = labeledQuotes.find(
          (quote) => quote.vendorName === vendorName
        );

        return {
          _id: rfq._id,
          RFQNumber: rfq.RFQNumber,
          label: vendorQuote ? vendorQuote.label : "-",
          trucksAllotted: vendorQuote ? vendorQuote.actualTrucksAllotted : 0,
        };
      })
    );

    res.status(200).json(pendingRFQs);
  } catch (error) {
    console.error("Error fetching pending RFQs for vendor:", error);
    res.status(500).json({ error: "Failed to fetch pending RFQs." });
  }
});

// accept RFQ by Vendor
app.post("/api/accept-rfq", async (req, res) => {
  const { rfqId, vendorName } = req.body;

  try {
    // Update RFQ status or perform any necessary updates
    const rfq = await RFQ.findById(rfqId);
    if (!rfq) {
      return res.status(404).json({ error: "RFQ not found." });
    }

    // Send confirmation emails to both vendor and admin
    const vendor = await Vendor.findOne({ vendorName });
    if (vendor) {
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

      // Send email to Vendor
      await transporter.sendMail({
        from: "aarnavsingh836@gmail.com",
        to: vendor.email,
        subject: "RFQ Acceptance Confirmation",
        text: `You have successfully accepted the RFQ ${rfq.RFQNumber}. Thank you!`,
      });

      // Send email to Admin
      await transporter.sendMail({
        from: "aarnavsingh836@gmail.com",
        to: "aarnavsingh836@gmail.com", // Admin email
        subject: "RFQ Accepted by Vendor",
        text: `Vendor ${vendorName} has accepted the RFQ ${rfq.RFQNumber}.`,
      });

      res
        .status(200)
        .json({ success: true, message: "RFQ accepted and emails sent." });
    } else {
      res.status(404).json({ error: "Vendor not found." });
    }
  } catch (error) {
    console.error("Error accepting RFQ:", error);
    res.status(500).json({ error: "Failed to accept RFQ." });
  }
});

// Fetch all closed RFQs (for all vendors)
app.get("/api/closed-rfqs", async (req, res) => {
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
});

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
      // Fetch only the selected vendors
      vendorsToEmail = await Vendor.find(
        { _id: { $in: selectedVendorIds } },
        "email vendorName"
      );
    } else {
      // No vendors selected
      console.log("No selected vendors for participation reminder.");
      return { success: false, message: "No vendors selected" };
    }

    const vendorEmails = vendorsToEmail.map((vendor) => vendor.email);

    if (vendorEmails.length > 0) {
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

      const mailOptions = {
        from: "aarnavsingh836@gmail.com",
        to: vendorEmails.join(", "),
        subject: `Reminder: Participation for RFQ ${rfq.RFQNumber}`,
        html: `
          <p>Dear Vendor,</p>
          <p>This is a reminder to participate in the RFQ process for RFQ Number: <strong>${rfq.RFQNumber}</strong>.</p>
          <p>Please submit your quote at your earliest convenience.</p>
          <p>Best regards,<br/>Premier Energies Limited</p>
        `,
      };

      await transporter.sendMail(mailOptions);
      console.log("Participation reminder emails sent successfully.");
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

// Endpoint for sending participation reminder emails
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

// Function to check and update RFQ status based on the closing date and time
const updateRFQStatusBasedOnClosingDate = async () => {
  try {
    const now = moment().tz("Asia/Kolkata");
    const rfqs = await RFQ.find({ status: "open" });

    for (const rfq of rfqs) {
      if (!rfq.RFQClosingDate || !rfq.RFQClosingTime) {
        console.warn(`RFQ ${rfq.RFQNumber} is missing closing date or time.`);
        continue;
      }

      const closingDateTime = moment.tz(
        `${moment(rfq.RFQClosingDate).format("YYYY-MM-DD")}T${
          rfq.RFQClosingTime
        }:00`,
        "Asia/Kolkata"
      );

      if (now.isAfter(closingDateTime)) {
        rfq.status = "closed";
        await rfq.save();
        console.log(`RFQ ${rfq.RFQNumber} has been updated to 'closed'.`);
      }
    }
  } catch (error) {
    console.error("Error updating RFQ status based on closing date:", error);
  }
};

cron.schedule("* * * * *", updateRFQStatusBasedOnClosingDate);

// function to send reminder emails to vendors
async function sendReminderEmails() {
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
              Premier Energies
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
}

// schedule the job to run every minute for testing
cron.schedule("*/720 * * * *", () => {
  console.log("Cron job execution triggered");
  sendReminderEmails();
});

console.log("Cron job scheduled to run every minute");

// start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));