import React, { useState, useEffect } from "react";
import axios from "axios";

const NewRFQForm = () => {
  const [formData, setFormData] = useState({
    RFQNumber: "",
    shortName: "",
    companyType: "",
    sapOrder: "",
    itemType: "",
    customItemType: "",
    customerName: "",
    originLocation: "",
    dropLocationState: "",
    dropLocationDistrict: "",
    vehicleType: "",
    customVehicleType: "",
    additionalVehicleDetails: "",
    numberOfVehicles: "",
    weight: "",
    budgetedPriceBySalesDept: "",
    maxAllowablePrice: "",
    vehiclePlacementBeginDate: "",
    vehiclePlacementEndDate: "",
    eReverseDate: "",
    eReverseTime: "",
    RFQClosingDate: "",
    RFQClosingTime: "",
    eReverseToggle: false,
    rfqType: "D2D",
    initialQuoteEndTime: "",
    evaluationEndTime: "",
    address: "",
    pincode: "",
  });

  const [vendors, setVendors] = useState([]);
  const [selectedVendors, setSelectedVendors] = useState([]);
  const [districtOptions, setDistrictOptions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const stateToDistricts = {
    "Andhra Pradesh": [
      "Anantapur",
      "Chittoor",
      "East Godavari",
      "Guntur",
      "Krishna",
      "Kurnool",
      "Nellore",
      "Prakasam",
      "Srikakulam",
      "Visakhapatnam",
      "Vizianagaram",
      "West Godavari",
      "YSR Kadapa",
    ],
    "Arunachal Pradesh": [
      "Anjaw",
      "Changlang",
      "Dibang Valley",
      "East Kameng",
      "East Siang",
      "Kamle",
      "Kra Daadi",
      "Kurung Kumey",
      "Lepa Rada",
      "Lohit",
      "Longding",
      "Lower Dibang Valley",
      "Lower Siang",
      "Lower Subansiri",
      "Namsai",
      "Pakke Kessang",
      "Papum Pare",
      "Shi Yomi",
      "Siang",
      "Tawang",
      "Tirap",
      "Upper Siang",
      "Upper Subansiri",
      "West Kameng",
      "West Siang",
    ],
    Assam: [
      "Baksa",
      "Barpeta",
      "Biswanath",
      "Bongaigaon",
      "Cachar",
      "Charaideo",
      "Chirang",
      "Darrang",
      "Dhemaji",
      "Dhubri",
      "Dibrugarh",
      "Dima Hasao",
      "Goalpara",
      "Golaghat",
      "Hailakandi",
      "Hojai",
      "Jorhat",
      "Kamrup Metropolitan",
      "Kamrup",
      "Karbi Anglong",
      "Karimganj",
      "Kokrajhar",
      "Lakhimpur",
      "Majuli",
      "Morigaon",
      "Nagaon",
      "Nalbari",
      "Sivasagar",
      "Sonitpur",
      "South Salmara-Mankachar",
      "Tinsukia",
      "Udalguri",
      "West Karbi Anglong",
    ],
    Bihar: [
      "Araria",
      "Arwal",
      "Aurangabad",
      "Banka",
      "Begusarai",
      "Bhagalpur",
      "Bhojpur",
      "Buxar",
      "Darbhanga",
      "East Champaran (Motihari)",
      "Gaya",
      "Gopalganj",
      "Jamui",
      "Jehanabad",
      "Kaimur (Bhabua)",
      "Katihar",
      "Khagaria",
      "Kishanganj",
      "Lakhisarai",
      "Madhepura",
      "Madhubani",
      "Munger (Monghyr)",
      "Muzaffarpur",
      "Nalanda",
      "Nawada",
      "Patna",
      "Purnia (Purnea)",
      "Rohtas",
      "Saharsa",
      "Samastipur",
      "Saran",
      "Sheikhpura",
      "Sheohar",
      "Sitamarhi",
      "Siwan",
      "Supaul",
      "Vaishali",
      "West Champaran",
    ],
    Chhattisgarh: [
      "Balod",
      "Baloda Bazar",
      "Balrampur",
      "Bastar",
      "Bemetara",
      "Bijapur",
      "Bilaspur",
      "Dantewada (South Bastar)",
      "Dhamtari",
      "Durg",
      "Gariyaband",
      "Gaurela Pendra Marwahi",
      "Janjgir-Champa",
      "Jashpur",
      "Kabirdham (Kawardha)",
      "Kanker (North Bastar)",
      "Kondagaon",
      "Korba",
      "Koriya",
      "Mahasamund",
      "Mungeli",
      "Narayanpur",
      "Raigarh",
      "Raipur",
      "Rajnandgaon",
      "Sukma",
      "Surajpur",
      "Surguja",
    ],
    Goa: ["North Goa", "South Goa"],
    Gujarat: [
      "Ahmedabad",
      "Amreli",
      "Anand",
      "Aravalli",
      "Banaskantha (Palanpur)",
      "Bharuch",
      "Bhavnagar",
      "Botad",
      "Chhota Udaipur",
      "Dahod",
      "Dang (Ahwa)",
      "Devbhoomi Dwarka",
      "Gandhinagar",
      "Gir Somnath",
      "Jamnagar",
      "Junagadh",
      "Kheda (Nadiad)",
      "Kutch",
      "Mahisagar",
      "Mehsana",
      "Morbi",
      "Narmada (Rajpipla)",
      "Navsari",
      "Panchmahal (Godhra)",
      "Patan",
      "Porbandar",
      "Rajkot",
      "Sabarkantha (Himmatnagar)",
      "Surat",
      "Surendranagar",
      "Tapi (Vyara)",
      "Vadodara",
      "Valsad",
    ],
    Haryana: [
      "Ambala",
      "Bhiwani",
      "Charkhi Dadri",
      "Faridabad",
      "Fatehabad",
      "Gurugram",
      "Hisar",
      "Jhajjar",
      "Jind",
      "Kaithal",
      "Karnal",
      "Kurukshetra",
      "Mahendragarh",
      "Nuh",
      "Palwal",
      "Panchkula",
      "Panipat",
      "Rewari",
      "Rohtak",
      "Sirsa",
      "Sonipat",
      "Yamunanagar",
    ],
    "Himachal Pradesh": [
      "Bilaspur",
      "Chamba",
      "Hamirpur",
      "Kangra",
      "Kinnaur",
      "Kullu",
      "Lahaul & Spiti",
      "Mandi",
      "Shimla",
      "Sirmaur (Sirmour)",
      "Solan",
      "Una",
    ],
    Jharkhand: [
      "Bokaro",
      "Chatra",
      "Deoghar",
      "Dhanbad",
      "Dumka",
      "East Singhbhum",
      "Garhwa",
      "Giridih",
      "Godda",
      "Gumla",
      "Hazaribagh",
      "Jamtara",
      "Khunti",
      "Koderma",
      "Latehar",
      "Lohardaga",
      "Pakur",
      "Palamu",
      "Ramgarh",
      "Ranchi",
      "Sahebganj",
      "Seraikela-Kharsawan",
      "Simdega",
      "West Singhbhum",
    ],
    Karnataka: [
      "Bagalkot",
      "Ballari (Bellary)",
      "Belagavi (Belgaum)",
      "Bengaluru (Bangalore) Rural",
      "Bengaluru (Bangalore) Urban",
      "Bidar",
      "Chamarajanagar",
      "Chikballapur",
      "Chikkamagaluru (Chikmagalur)",
      "Chitradurga",
      "Dakshina Kannada",
      "Davanagere",
      "Dharwad",
      "Gadag",
      "Hassan",
      "Haveri",
      "Kalaburagi (Gulbarga)",
      "Kodagu",
      "Kolar",
      "Koppal",
      "Mandya",
      "Mysuru (Mysore)",
      "Raichur",
      "Ramanagara",
      "Shivamogga (Shimoga)",
      "Tumakuru (Tumkur)",
      "Udupi",
      "Uttara Kannada (Karwar)",
      "Vijayapura (Bijapur)",
      "Yadgir",
    ],
    Kerala: [
      "Alappuzha",
      "Ernakulam",
      "Idukki",
      "Kannur",
      "Kasaragod",
      "Kollam",
      "Kottayam",
      "Kozhikode",
      "Malappuram",
      "Palakkad",
      "Pathanamthitta",
      "Thiruvananthapuram",
      "Thrissur",
      "Wayanad",
    ],
    "Madhya Pradesh": [
      "Agar Malwa",
      "Alirajpur",
      "Anuppur",
      "Ashoknagar",
      "Balaghat",
      "Barwani",
      "Betul",
      "Bhind",
      "Bhopal",
      "Burhanpur",
      "Chhatarpur",
      "Chhindwara",
      "Damoh",
      "Datia",
      "Dewas",
      "Dhar",
      "Dindori",
      "Guna",
      "Gwalior",
      "Harda",
      "Hoshangabad",
      "Indore",
      "Jabalpur",
      "Jhabua",
      "Katni",
      "Khandwa",
      "Khargone",
      "Mandla",
      "Mandsaur",
      "Morena",
      "Narsinghpur",
      "Neemuch",
      "Panna",
      "Raisen",
      "Rajgarh",
      "Ratlam",
      "Rewa",
      "Sagar",
      "Satna",
      "Sehore",
      "Seoni",
      "Shahdol",
      "Shajapur",
      "Sheopur",
      "Shivpuri",
      "Sidhi",
      "Singrauli",
      "Tikamgarh",
      "Ujjain",
      "Umaria",
      "Vidisha",
    ],
    Maharashtra: [
      "Ahmednagar",
      "Akola",
      "Amravati",
      "Aurangabad",
      "Beed",
      "Bhandara",
      "Buldhana",
      "Chandrapur",
      "Dhule",
      "Gadchiroli",
      "Gondia",
      "Hingoli",
      "Jalgaon",
      "Jalna",
      "Kolhapur",
      "Latur",
      "Mumbai City",
      "Mumbai Suburban",
      "Nagpur",
      "Nanded",
      "Nandurbar",
      "Nashik",
      "Osmanabad",
      "Palghar",
      "Parbhani",
      "Pune",
      "Raigad",
      "Ratnagiri",
      "Sangli",
      "Satara",
      "Sindhudurg",
      "Solapur",
      "Thane",
      "Wardha",
      "Washim",
      "Yavatmal",
    ],
    Manipur: [
      "Bishnupur",
      "Chandel",
      "Churachandpur",
      "Imphal East",
      "Imphal West",
      "Jiribam",
      "Kakching",
      "Kamjong",
      "Kangpokpi",
      "Noney",
      "Pherzawl",
      "Senapati",
      "Tamenglong",
      "Tengnoupal",
      "Thoubal",
      "Ukhrul",
    ],
    Meghalaya: [
      "East Garo Hills",
      "East Jaintia Hills",
      "East Khasi Hills",
      "North Garo Hills",
      "Ri Bhoi",
      "South Garo Hills",
      "South West Garo Hills",
      "South West Khasi Hills",
      "West Garo Hills",
      "West Jaintia Hills",
      "West Khasi Hills",
    ],
    Mizoram: [
      "Aizawl",
      "Champhai",
      "Hnahthial",
      "Khawzawl",
      "Kolasib",
      "Lawngtlai",
      "Lunglei",
      "Mamit",
      "Saiha",
      "Saitual",
      "Serchhip",
    ],
    Nagaland: [
      "Chumukedima",
      "Dimapur",
      "Kiphire",
      "Kohima",
      "Longleng",
      "Mokokchung",
      "Mon",
      "Noklak",
      "Peren",
      "Phek",
      "Tuensang",
      "Wokha",
      "Zunheboto",
    ],
    Odisha: [
      "Angul",
      "Balangir",
      "Balasore (Baleswar)",
      "Bargarh (Baragarh)",
      "Bhadrak",
      "Boudh (Bauda)",
      "Cuttack",
      "Debagarh (Deogarh)",
      "Dhenkanal",
      "Gajapati",
      "Ganjam",
      "Jagatsinghapur",
      "Jajpur",
      "Jharsuguda",
      "Kalahandi",
      "Kandhamal",
      "Kendrapara",
      "Kendujhar (Keonjhar)",
      "Khordha",
      "Koraput",
      "Malkangiri",
      "Mayurbhanj",
      "Nabarangpur",
      "Nayagarh",
      "Nuapada",
      "Puri",
      "Rayagada",
      "Sambalpur",
      "Sonepur",
      "Sundargarh",
    ],
    Punjab: [
      "Amritsar",
      "Barnala",
      "Bathinda",
      "Faridkot",
      "Fatehgarh Sahib",
      "Fazilka",
      "Ferozepur",
      "Gurdaspur",
      "Hoshiarpur",
      "Jalandhar",
      "Kapurthala",
      "Ludhiana",
      "Mansa",
      "Moga",
      "Mohali (SAS Nagar)",
      "Muktsar",
      "Pathankot",
      "Patiala",
      "Rupnagar",
      "Sangrur",
      "Shaheed Bhagat Singh Nagar (Nawanshahr)",
      "Tarn Taran",
    ],
    Rajasthan: [
      "Ajmer",
      "Alwar",
      "Banswara",
      "Baran",
      "Barmer",
      "Bharatpur",
      "Bhilwara",
      "Bikaner",
      "Bundi",
      "Chittorgarh",
      "Churu",
      "Dausa",
      "Dholpur",
      "Dungarpur",
      "Hanumangarh",
      "Jaipur",
      "Jaisalmer",
      "Jalore",
      "Jhalawar",
      "Jhunjhunu",
      "Jodhpur",
      "Karauli",
      "Kota",
      "Nagaur",
      "Pali",
      "Pratapgarh",
      "Rajsamand",
      "Sawai Madhopur",
      "Sikar",
      "Sirohi",
      "Sri Ganganagar",
      "Tonk",
      "Udaipur",
    ],
    Sikkim: ["East Sikkim", "North Sikkim", "South Sikkim", "West Sikkim"],
    "Tamil Nadu": [
      "Ariyalur",
      "Chengalpattu",
      "Chennai",
      "Coimbatore",
      "Cuddalore",
      "Dharmapuri",
      "Dindigul",
      "Erode",
      "Kallakurichi",
      "Kancheepuram",
      "Karur",
      "Krishnagiri",
      "Madurai",
      "Mayiladuthurai",
      "Nagapattinam",
      "Namakkal",
      "Nilgiris",
      "Perambalur",
      "Pudukkottai",
      "Ramanathapuram",
      "Ranipet",
      "Salem",
      "Sivaganga",
      "Tenkasi",
      "Thanjavur",
      "Theni",
      "Thiruchirappalli",
      "Thirupathur",
      "Thiruvarur",
      "Thoothukudi",
      "Tirunelveli",
      "Tiruppur",
      "Tiruvallur",
      "Tiruvannamalai",
      "Vellore",
      "Viluppuram",
      "Virudhunagar",
    ],
    Telangana: [
      "Adilabad",
      "Bhadradri Kothagudem",
      "Hyderabad",
      "Jagtial",
      "Jangaon",
      "Jayashankar Bhupalpally",
      "Jogulamba Gadwal",
      "Kamareddy",
      "Karimnagar",
      "Khammam",
      "Komaram Bheem Asifabad",
      "Mahabubabad",
      "Mahabubnagar",
      "Mancherial",
      "Medak",
      "Medchal–Malkajgiri",
      "Mulugu",
      "Nagarkurnool",
      "Nalgonda",
      "Narayanpet",
      "Nirmal",
      "Nizamabad",
      "Peddapalli",
      "Rajanna Sircilla",
      "Ranga Reddy",
      "Sangareddy",
      "Siddipet",
      "Suryapet",
      "Vikarabad",
      "Wanaparthy",
      "Warangal Rural",
      "Warangal Urban",
      "Yadadri Bhuvanagiri",
    ],
    Tripura: [
      "Dhalai",
      "Gomati",
      "Khowai",
      "North Tripura",
      "Sepahijala",
      "South Tripura",
      "Unakoti",
      "West Tripura",
    ],
    "Uttar Pradesh": [
      "Agra",
      "Aligarh",
      "Ambedkar Nagar",
      "Amethi (Chatrapati Sahuji Mahraj Nagar)",
      "Amroha (J.P. Nagar)",
      "Auraiya",
      "Ayodhya (Faizabad)",
      "Azamgarh",
      "Baghpat",
      "Bahraich",
      "Ballia",
      "Balrampur",
      "Banda",
      "Barabanki",
      "Bareilly",
      "Basti",
      "Bhadohi",
      "Bijnor",
      "Budaun",
      "Bulandshahr",
      "Chandauli",
      "Chitrakoot",
      "Deoria",
      "Etah",
      "Etawah",
      "Farrukhabad",
      "Fatehpur",
      "Firozabad",
      "Gautam Buddha Nagar",
      "Ghaziabad",
      "Ghazipur",
      "Gonda",
      "Gorakhpur",
      "Hamirpur",
      "Hapur (Panchsheel Nagar)",
      "Hardoi",
      "Hathras",
      "Jalaun",
      "Jaunpur",
      "Jhansi",
      "Kannauj",
      "Kanpur Dehat",
      "Kanpur Nagar",
      "Kasganj (Kanshiram Nagar)",
      "Kaushambi",
      "Kushinagar (Padrauna)",
      "Lakhimpur - Kheri",
      "Lalitpur",
      "Lucknow",
      "Maharajganj",
      "Mahoba",
      "Mainpuri",
      "Mathura",
      "Mau",
      "Meerut",
      "Mirzapur",
      "Moradabad",
      "Muzaffarnagar",
      "Pilibhit",
      "Pratapgarh",
      "Prayagraj (Allahabad)",
      "Raebareli",
      "Rampur",
      "Saharanpur",
      "Sambhal (Bhim Nagar)",
      "Sant Kabir Nagar",
      "Shahjahanpur",
      "Shamli",
      "Shrawasti",
      "Siddharth Nagar",
      "Sitapur",
      "Sonbhadra",
      "Sultanpur",
      "Unnao",
      "Varanasi",
    ],
    Uttarakhand: [
      "Almora",
      "Bageshwar",
      "Chamoli",
      "Champawat",
      "Dehradun",
      "Haridwar",
      "Nainital",
      "Pauri Garhwal",
      "Pithoragarh",
      "Rudraprayag",
      "Tehri Garhwal",
      "Udham Singh Nagar",
      "Uttarkashi",
    ],
    "West Bengal": [
      "Alipurduar",
      "Bankura",
      "Birbhum",
      "Cooch Behar",
      "Dakshin Dinajpur (South Dinajpur)",
      "Darjeeling",
      "Hooghly",
      "Howrah",
      "Jalpaiguri",
      "Jhargram",
      "Kalimpong",
      "Kolkata",
      "Malda",
      "Murshidabad",
      "Nadia",
      "North 24 Parganas",
      "Paschim Bardhaman (West Bardhaman)",
      "Paschim Medinipur (West Medinipur)",
      "Purba Bardhaman (East Bardhaman)",
      "Purba Medinipur (East Medinipur)",
      "Purulia",
      "South 24 Parganas",
      "Uttar Dinajpur (North Dinajpur)",
    ],
  };

  useEffect(() => {
    fetchNextRFQNumber();
    fetchVendors();
  }, []);

  const fetchNextRFQNumber = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(
        "https://petp.onrender.com/api/next-rfq-number"
      );
      setFormData((prevData) => ({
        ...prevData,
        RFQNumber: response.data.RFQNumber,
      }));
    } catch (error) {
      console.error("Error fetching the next RFQ number:", error);
      alert("Failed to fetch the next RFQ number. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchVendors = async () => {
    try {
      const response = await axios.get("https://petp.onrender.com/api/vendors");
      setVendors(response.data); // Set vendor data
    } catch (error) {
      console.error("Error fetching vendors:", error);
      alert("Failed to fetch vendors.");
    }
  };

  const handleVendorSelection = (vendorId) => {
    setSelectedVendors((prevSelected) => {
      if (prevSelected.includes(vendorId)) {
        return prevSelected.filter((id) => id !== vendorId); // Deselect
      } else {
        return [...prevSelected, vendorId]; // Select
      }
    });
  };

  const handleSelectAllVendors = (e) => {
    const isChecked = e.target.checked;
    if (isChecked) {
      // Select all vendors
      const allVendorIds = vendors.map((vendor) => vendor._id);
      setSelectedVendors(allVendorIds);
    } else {
      // Deselect all vendors
      setSelectedVendors([]);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name === "dropLocationState") {
      setFormData((prevData) => ({
        ...prevData,
        dropLocationState: value,
        dropLocationDistrict: "",
      }));
      setDistrictOptions(stateToDistricts[value] || []);
      return;
    }

    // Reset custom fields when dropdown changes
    if (name === "itemType" && value !== "Others") {
      setFormData((prevData) => ({
        ...prevData,
        itemType: value,
        customItemType: "",
      }));
    } else if (name === "vehicleType" && value !== "Other") {
      setFormData((prevData) => ({
        ...prevData,
        vehicleType: value,
        customVehicleType: "",
      }));
    } else {
      setFormData((prevData) => ({
        ...prevData,
        [name]: type === "checkbox" ? checked : value,
      }));
    }

    let error = "";
    if (
      [
        "RFQNumber",
        "weight",
        "budgetedPriceBySalesDept",
        "maxAllowablePrice",
        "numberOfVehicles",
      ].includes(name)
    ) {
      if (!/^\d*$/.test(value)) {
        error = "This field must be a number.";
      }
    } else if (name === "sapOrder") {
      if (!/^[a-zA-Z0-9]*$/.test(value)) {
        error = "This field must be alphanumeric.";
      }
    } else if (name === "pincode") {
      if (!/^\d{6}$/.test(value)) {
        error = "Pincode must be exactly 6 digits and contain only numbers.";
      }
    }

    // Add this validation block for 'weight'
    if (name === "weight" && value !== "") {
      const numericValue = parseInt(value, 10);
      if (isNaN(numericValue) || numericValue < 1 || numericValue > 99) {
        error = "Weight must be a number between 1 and 99.";
      }
    }

    if (name === "eReverseToggle") {
      setFormData((prevData) => ({
        ...prevData,
        eReverseToggle: checked,
        eReverseDate: checked ? prevData.eReverseDate : "",
        eReverseTime: checked ? prevData.eReverseTime : "",
      }));
      return;
    }

    setErrors((prevErrors) => ({ ...prevErrors, [name]: error }));
    setFormData((prevData) => ({
      ...prevData,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.itemType === "Others" && !formData.customItemType.trim()) {
      alert("Please specify the Item Type.");
      return;
    }
    if (
      formData.vehicleType === "Other" &&
      !formData.customVehicleType.trim()
    ) {
      alert("Please specify the Vehicle Type.");
      return;
    }

    if (Object.values(errors).some((error) => error)) {
      alert(
        "Please fix the following errors:\n" +
          Object.entries(errors)
            .filter(([_, error]) => error)
            .map(
              ([field, error]) =>
                `${field.replace(/([A-Z])/g, " $1").trim()}: ${error}`
            )
            .join("\n")
      );
      return;
    }

    setIsLoading(true);
    try {
      const eReverseDateTime = formData.eReverseToggle
        ? new Date(`${formData.eReverseDate}T${formData.eReverseTime}`)
        : null;

      const dataToSend = {
        ...formData,
        selectedVendors,
        initialQuoteEndTime: formData.initialQuoteEndTime,
        evaluationEndTime: formData.evaluationEndTime,
        eReverseDate: eReverseDateTime,
        itemType:
          formData.itemType === "Others"
            ? formData.customItemType
            : formData.itemType,
        vehicleType:
          formData.vehicleType === "Other"
            ? formData.customVehicleType
            : formData.vehicleType,
      };

      delete dataToSend.customItemType;
      delete dataToSend.customVehicleType;

      const response = await axios.post(
        "https://petp.onrender.com/api/rfq",
        dataToSend
      );

      if (
        response.status === 201 &&
        response.data.message === "RFQ created and email sent successfully"
      ) {
        alert("RFQ submitted successfully!");
        setFormData({
          RFQNumber: "",
          shortName: "",
          companyType: "",
          sapOrder: "",
          itemType: "",
          customItemType: "",
          customerName: "",
          originLocation: "",
          dropLocationState: "",
          dropLocationDistrict: "",
          vehicleType: "",
          customVehicleType: "",
          additionalVehicleDetails: "",
          numberOfVehicles: "",
          weight: "",
          budgetedPriceBySalesDept: "",
          maxAllowablePrice: "",
          vehiclePlacementBeginDate: "",
          vehiclePlacementEndDate: "",
          eReverseDate: "",
          eReverseTime: "",
          RFQClosingDate: "",
          RFQClosingTime: "",
          eReverseToggle: false,
          rfqType: "D2D",
          initialQuoteEndTime: "",
          evaluationEndTime: "",
        });
        fetchNextRFQNumber();
      } else {
        console.error("Unexpected response from server:", response.data);
        alert("Failed to submit RFQ. " + response.data.message);
      }
    } catch (error) {
      console.error("Error submitting RFQ:", error);
      alert(
        `Failed to submit RFQ. ${
          error.response?.data?.message || error.message
        }`
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto mt-8 px-4 py-6 bg-transparent text-black rounded-lg shadow-lg border border-black">
      <h2 className="text-2xl font-bold mb-6 text-center">Create New RFQ</h2>
      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        <div className="mb-4">
          <label className="block text-xl text-black">RFQ Number</label>
          <input
            type="text"
            name="RFQNumber"
            value={formData.RFQNumber}
            readOnly
            placeholder={isLoading ? "Loading..." : "RFQ Number"}
            className="mt-1 block w-full px-3 py-2 border bg-gray-200 hover:bg-white border-black rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            required
          />
        </div>

        <div className="mb-4">
          <label className="block text-xl font-medium text-black">
            RFQ Type
          </label>
          <select
            name="rfqType"
            value={formData.rfqType}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 border bg-gray-200 hover:bg-white border-black rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            required
          >
            <option value="D2D">D2D (Day to Day)</option>
            <option value="Long Term">Long Term</option>
          </select>
        </div>

        <div className="mb-4">
          <label className="block text-xl font-medium text-black">
            Short Name
          </label>
          <input
            type="text"
            name="shortName"
            value={formData.shortName}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 border border-black bg-gray-200 hover:bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            required
          />
          {errors.shortName && (
            <p className="text-red-600 font-bold mt-1">{errors.shortName}</p>
          )}
        </div>

        <div className="mb-4">
          <label className="block text-xl font-medium text-black">
            Company Type
          </label>
          <input
            type="text"
            name="companyType"
            value={formData.companyType}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 border bg-gray-200 hover:bg-white border-black rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            required
          />
          {errors.companyType && (
            <p className="text-red-600 font-bold mt-1">{errors.companyType}</p>
          )}
        </div>

        <div className="mb-4">
          <label className="block text-xl font-medium text-black">
            SAP Order
          </label>
          <input
            type="text"
            name="sapOrder"
            value={formData.sapOrder}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 border bg-gray-200 hover:bg-white border-black rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            required
          />
          {errors.sapOrder && (
            <p className="text-red-600 font-bold mt-1">{errors.sapOrder}</p>
          )}
        </div>

        <div className="mb-4">
          <label className="block text-xl font-medium text-black">
            Item Type
          </label>
          <select
            name="itemType"
            value={formData.itemType}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 border bg-gray-200 hover:bg-white border-black rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            required
          >
            <option value="">Select Item Type</option>
            <option value="Module">Module</option>
            <option value="Cell">Cell</option>
            <option value="Others">Others</option>
          </select>

          {/* Conditionally render custom Item Type input */}
          {formData.itemType === "Others" && (
            <div className="mt-2">
              <label className="block text-xl font-medium text-black">
                Please specify Item Type
              </label>
              <input
                type="text"
                name="customItemType"
                value={formData.customItemType}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border bg-gray-200 hover:bg-white border-black rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                required
              />
            </div>
          )}
        </div>

        <div className="mb-4">
          <label className="block text-xl font-medium text-black">
            Customer Name
          </label>
          <input
            type="text"
            name="customerName"
            value={formData.customerName}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 border bg-gray-200 hover:bg-white border-black rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            required
          />
          {errors.customerName && (
            <p className="text-red-600 font-bold mt-1">{errors.customerName}</p>
          )}
        </div>

        <div className="mb-4">
          <label className="block text-xl font-medium text-black">
            Origin Location
          </label>
          <input
            type="text"
            name="originLocation"
            value={formData.originLocation}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 border bg-gray-200 hover:bg-white border-black rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            required
          />
          {errors.originLocation && (
            <p className="text-red-600 font-bold mt-1">
              {errors.originLocation}
            </p>
          )}
        </div>

        <div className="mb-4">
          <label className="block text-xl font-medium text-black">
            Drop Location State
          </label>
          <select
            name="dropLocationState"
            value={formData.dropLocationState}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 border bg-gray-200 hover:bg-white border-black rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            required
          >
            <option value="">Select State</option>
            {Object.keys(stateToDistricts).map((state) => (
              <option key={state} value={state}>
                {state}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-4">
          <label className="block text-xl font-medium text-black">
            Drop Location District
          </label>
          <select
            name="dropLocationDistrict"
            value={formData.dropLocationDistrict}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 border bg-gray-200 hover:bg-white border-black rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            required
          >
            <option value="">Select District</option>
            {districtOptions.map((district) => (
              <option key={district} value={district}>
                {district}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-4 md:col-span-3">
          <label className="block text-xl font-medium text-black">
            Destination Address (NOT including customer name)
          </label>
          <textarea
            name="address"
            value={formData.address}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 border bg-gray-200 hover:bg-white border-black rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            required
          ></textarea>
          {errors.address && (
            <p className="text-red-600 font-bold mt-1">{errors.address}</p>
          )}
        </div>

        <div className="mb-4">
          <label className="block text-xl font-medium text-black">
            Pincode
          </label>
          <input
            type="text"
            name="pincode"
            value={formData.pincode}
            onChange={handleChange}
            maxLength="6"
            className="mt-1 block w-full px-3 py-2 border bg-gray-200 hover:bg-white border-black rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            required
          />
          {errors.pincode && (
            <p className="text-red-600 font-bold mt-1">{errors.pincode}</p>
          )}
        </div> 

        <div className="mb-4">
          <label className="block text-xl font-medium text-black">
            Vehicle Type
          </label>
          <select
            name="vehicleType"
            value={formData.vehicleType}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 border bg-gray-200 hover:bg-white border-black rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            required
          >
            <option value="">Select Vehicle Type</option>
            <option value="Container">Container</option>
            <option value="Open Trailer">Open Trailer</option>
            <option value="DCM">DCM</option>
            <option value="Tractor">Tractor</option>
            <option value="Pickup">Pickup</option>
            <option value="Other">Other</option>
          </select>

          {/* Conditionally render custom Vehicle Type input */}
          {formData.vehicleType === "Other" && (
            <div className="mt-2">
              <label className="block text-xl font-medium text-black">
                Please specify Vehicle Type
              </label>
              <input
                type="text"
                name="customVehicleType"
                value={formData.customVehicleType}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border bg-gray-200 hover:bg-white border-black rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                required
              />
            </div>
          )}
        </div>

        <div className="mb-4">
          <label className="block text-xl font-medium text-black">
            Additional Vehicle Details
          </label>
          <select
            name="additionalVehicleDetails"
            value={formData.additionalVehicleDetails}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 border bg-gray-200 hover:bg-white border-black rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            required
          >
            <option value="">Select Additional Vehicle Details</option>
            <option value="20 Feet Container">20 Feet Container</option>
            <option value="40 Feet Container">40 Feet Container</option>
            <option value="40 ft HBT Trailer">40 Feet HBT Trailer</option>
            <option value="40 HQ Container">40 HQ Container</option>
            <option value="32MXL Container">32MXL Container</option>
            <option value="32SXL Container">32SXL Container</option>
            <option value="DCM 17 Feet">DCM 17 Feet</option>
            <option value="DCM 19 Feet">DCM 19 Feet</option>
            <option value="DCM 22 Feet">DCM 22 Feet</option>
            <option value="JCB 32 Feet">JCB 32 Feet</option>
          </select>
        </div>

        <div className="mb-4">
          <label className="block text-xl font-medium text-black">
            Number of Vehicles
          </label>
          <input
            type="number"
            name="numberOfVehicles"
            value={formData.numberOfVehicles}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 border bg-gray-200 hover:bg-white border-black rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            required
          />
          {errors.numberOfVehicles && (
            <p className="text-red-600 font-bold mt-1">
              {errors.numberOfVehicles}
            </p>
          )}
        </div>

        <div className="mb-4">
          <label className="block text-xl font-medium text-black">
            Weight in Tons
          </label>
          <input
            type="number"
            name="weight"
            value={formData.weight}
            onChange={handleChange}
            min="1"
            max="99"
            className="mt-1 block w-full px-3 py-2 border bg-gray-200 hover:bg-white border-black rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            required
          />
          {errors.weight && (
            <p className="text-red-600 font-bold mt-1">{errors.weight}</p>
          )}
        </div>

        <div className="mb-4">
          <label className="block text-xl font-medium text-black">
            Budgeted Price By Sales Dept.
          </label>
          <input
            type="text"
            name="budgetedPriceBySalesDept"
            value={formData.budgetedPriceBySalesDept}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 border bg-gray-200 hover:bg-white border-black rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            required
          />
          {errors.budgetedPriceBySalesDept && (
            <p className="text-red-600 font-bold mt-1">
              {errors.budgetedPriceBySalesDept}
            </p>
          )}
        </div>

        <div className="mb-4">
          <label className="block text-xl font-medium text-black">
            Max Allowable Price
          </label>
          <input
            type="text"
            name="maxAllowablePrice"
            value={formData.maxAllowablePrice}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 border bg-gray-200 hover:bg-white border-black rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            required
          />
          {errors.maxAllowablePrice && (
            <p className="text-red-600 font-bold mt-1">
              {errors.maxAllowablePrice}
            </p>
          )}
        </div>

        <div className="mb-4">
          <label className="block text-xl font-medium text-black">
            Vehicle Placement Begin Date
          </label>
          <input
            type="date"
            name="vehiclePlacementBeginDate"
            value={formData.vehiclePlacementBeginDate}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 border bg-gray-200 hover:bg-white border-black rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            required
          />
        </div>

        <div className="mb-4">
          <label className="block text-xl font-medium text-black">
            Vehicle Placement End Date
          </label>
          <input
            type="date"
            name="vehiclePlacementEndDate"
            value={formData.vehiclePlacementEndDate}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 border bg-gray-200 hover:bg-white border-black rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            required
          />
        </div>

        <div className="mb-4">
          <label className="block text-xl font-medium text-black">
            Initial Quote End Time
          </label>
          <input
            type="datetime-local"
            name="initialQuoteEndTime"
            value={formData.initialQuoteEndTime}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 border bg-gray-200 hover:bg-white border-black rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            required
          />
        </div>

        <div className="mb-4">
          <label className="block text-xl font-medium text-black">
            Evaluation End Time
          </label>
          <input
            type="datetime-local"
            name="evaluationEndTime"
            value={formData.evaluationEndTime}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 border bg-gray-200 hover:bg-white border-black rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            required
          />
        </div>

        {/* E-Reverse Toggle Switch */}
        {/* <div className="mb-4"> 
          <label className="block text-xl font-medium text-black">
            E-Reverse:
          </label>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              name="eReverseToggle"
              checked={formData.eReverseToggle}
              onChange={handleChange}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-indigo-600 peer-focus:ring-2 peer-focus:ring-indigo-500 transition-all duration-300"></div>
            <div className="dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform duration-300 transform peer-checked:translate-x-full"></div>
          </label>
        </div> */}

        {/* Conditionally render eReverseDate and eReverseTime fields */}
        {formData.eReverseToggle && (
          <>
            <div className="mb-4">
              <label className="block text-xl font-medium text-black">
                E-Reverse Date
              </label>
              <input
                type="date"
                name="eReverseDate"
                value={formData.eReverseDate}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border bg-gray-200 hover:bg-white border-black rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                required={formData.eReverseToggle}
              />
            </div>

            <div className="mb-4">
              <label className="block text-xl font-medium text-black">
                E-Reverse Time
              </label>
              <input
                type="time"
                name="eReverseTime"
                value={formData.eReverseTime}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border bg-gray-200 hover:bg-white border-black rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                required={formData.eReverseToggle}
              />
            </div>
          </>
        )}

        <div className="mb-4">
          <label className="block text-xl font-medium text-black">
            RFQ Closing Date
          </label>
          <input
            type="date"
            name="RFQClosingDate"
            value={formData.RFQClosingDate}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 border bg-gray-200 hover:bg-white border-black rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            required
          />
        </div>

        <div className="mb-4">
          <label className="block text-xl font-medium text-black">
            RFQ Closing Time
          </label>
          <input
            type="time"
            name="RFQClosingTime"
            value={formData.RFQClosingTime}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 border bg-gray-200 hover:bg-white border-black rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            required
          />
        </div>

        <div className="mb-4 md:col-span-3">
          <label className="text-black mb-2 font-bold items-center text-xl text-center">
            Which vendors should be notified?
          </label>
          <div className="mt-2 overflow-x-auto">
            {vendors.length > 0 ? (
              <table className="min-w-full divide-y border-black rounded-lg divide-black">
                <thead className="bg-gray-700 text-white">
                  <tr>
                    <th className="px-4 py-2 text-left text-sm font-medium text-white">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="selectAllVendors"
                          checked={
                            vendors.length > 0 &&
                            selectedVendors.length === vendors.length
                          }
                          onChange={handleSelectAllVendors}
                          className="form-checkbox h-4 w-4 text-indigo-600 transition duration-150 ease-in-out mr-2"
                        />
                        <label
                          htmlFor="selectAllVendors"
                          className="text-white"
                        >
                          Select All
                        </label>
                      </div>
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-white">
                      Company Name
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-white">
                      Email
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-black">
                  {vendors.map((vendor) => (
                    <tr key={vendor._id} className="hover:bg-gray-200">
                      <td className="px-4 py-2">
                        <input
                          type="checkbox"
                          id={vendor._id}
                          checked={selectedVendors.includes(vendor._id)}
                          onChange={() => handleVendorSelection(vendor._id)}
                          className="form-checkbox h-4 w-4 text-indigo-600 transition duration-150 ease-in-out"
                        />
                      </td>
                      <td className="px-4 py-2 text-sm text-black">
                        {vendor.companyName || vendor.vendorName}
                      </td>
                      <td className="px-4 py-2 text-sm text-black">
                        {vendor.email}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p>No vendors available to select.</p>
            )}
          </div>
        </div>

        <button
          type="submit"
          className={`md:col-span-3 bg-indigo-600 hover:bg-indigo-900 text-white font-bold py-2 px-4 rounded ${
            isLoading ? "cursor-not-allowed opacity-50" : ""
          }`}
          disabled={isLoading}
        >
          {isLoading ? "Submitting..." : "Submit RFQ"}
        </button>
      </form>
    </div>
  );
};

export default NewRFQForm;