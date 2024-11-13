// src/components/TC.jsx

import React from "react";

const TC = () => {
  // Define the terms and conditions content
  const termsAndConditionsContent = [
    {
      header: "1. E-bidding",
      content: [
        "PREMIER ENERGIES will issue daily inquiries for trucks through our LEAF application. These inquiries will be sent to approved transporters for their responses.",
        "The transporter must respond before the end of the time slot designated for submitting quotes. Upon submission, the application will display the transporter's relative competitive position (L1, L2, etc.). The transporter may submit a revised quote within the specified time slot. PREMIER ENERGIES reserves the right to cancel the inquiry and reissue it later or at a different time as necessary. Additionally, PREMIER ENERGIES may extend or modify the time period at its sole discretion for submitting quotes as needed.",
        "If a quote was submitted in error, the transporter may approach PREMIER ENERGIES' Head of Logistics immediately. The logistics manager will cancel the quote based on the transporter's written request via email. However, frequent requests of this nature are not encouraged.",
        "PREMIER ENERGIES will generally award the contract to the lowest bidder; however, it reserves the right to award the contract to bidders who quoted higher based on other critical business criteria. The decision of PREMIER ENERGIES in this regard is final and binding on all the bidders. No disputes in this regard shall be entertained. Additionally, PREMIER ENERGIES reserves the right to reassess the L1 bidder based on vendor performance as outlined in Clause 18.",
        "The transporter is required to arrange the truck within the specified time frame communicated by PREMIER ENERGIES. In case the transporter fails to do so, PREMIER ENERGIES shall have the right to impose a penalty. Additionally, PREMIER ENERGIES reserves the right to engage an alternative transporter under the risk purchase clause. Any difference in freight costs incurred by PREMIER ENERGIES will be charged to the transporter who failed to provide the truck on time, in accordance with the agreed terms.",
        "The Service Purchase Order will be issued by the PREMIER ENERGIES Logistics team following vehicle mobilization. The transporter must obtain prior email confirmation from the PREMIER ENERGIES Logistics team for any associated costs, including detention or unloading charges, before incurring these expenses.",
      ],
    },
    {
      header: "2. Truck Reporting at Loading Point",
      content: [
        "Loading will be conducted on the same day, depending on the number of pending trucks. If loading cannot be completed on that day, PREMIER ENERGIES will arrange to load the materials the following day. Halting charges will not apply if the vehicle is detained at the loading point for up to 24 hours; however, detention charges as outlined in point 9 will apply beyond this period.",
      ],
    },
    {
      header: "3. Instructions to Driver",
      content: [
        "Drivers and cleaners of the vehicle should strictly follow the in-premises rules and regulations of PREMIER ENERGIES/PREMIER ENERGIES’s customers after reaching the loading point/unloading point.",
        "Drivers and cleaners of the vehicle shall be medically fit and should not be in an inebriated state at all times during the transshipment.",
      ],
    },
    {
      header: "4. E-Way Bill",
      content: [
        "If an e-way bill is close to expiration and the subject consignment has not yet been delivered to the customer, it is the transporter’s responsibility to extend it before it expires. In case the transporter fails to do so, the cost of the goods/charges arising out of such non-compliance under the provisions of the GST Act and any applicable law shall be borne by the transporter. The company shall not have any liability in this regard.",
      ],
    },
    {
      header: "5. Quality of Truck",
      content: [
        "PREMIER ENERGIES reserves the right to refuse acceptance of any vehicle that is not in proper condition or deemed unsuitable for the safe transportation of goods. The decision of PREMIER ENERGIES in this regard shall be final and binding.",
      ],
    },
    {
      header: "6. RTA / Statutory Requirements",
      content: [
        "The transporter must ensure that the vehicle is fully fit in all respects, accompanied by the necessary documentation, and compliant with RTA and other statutory regulations.",
      ],
    },
    {
      header: "7. Safety Norms",
      content: [
        "Vehicles must meet the standard safety norms as per PREMIER ENERGIES’ guidelines strictly. These shall be provided once the vendor allocation is done.",
      ],
    },
    {
      header: "8. RTA Penalties",
      content: [
        "The transporter must obtain prior approval from the PREMIER ENERGIES logistics team for the payment of any charges related to overload or ODA consignments identified during the transit. This requirement applies solely to the weight of consignments pertaining to PREMIER ENERGIES (excluding any illegal loading by the driver or agent), and reimbursement will be considered based on merit and upon submission of the necessary proof of payment.",
      ],
    },
    {
      header: "9. Detention Charges",
      content: [
        "PREMIER ENERGIES will pay detention charges as follows, effective after a free halting period of 24 hours from the time of arrival at the destination:",
        "- Rs. 500 per day for LCV",
        "- Rs. 750 per day for FTL (17FT / 19FT)",
        "- Rs. 1,500 per day for Taurus, MXL, and SXL",
        "- Rs. 2,000 per day for 40” HBT",
      ],
    },
    {
      header: "10. Additional Distance Charges",
      content: [
        "The transporter is required to deliver the consignment to the actual destination without seeking additional costs if the extra distance is less than 50 km from the destination specified in the inquiry. If the additional distance exceeds 50 km, prior approval must be obtained from PREMIER ENERGIES for any additional freight charges, and bills will be processed accordingly.",
      ],
    },
    {
      header: "11. Loading of Unauthorized Materials",
      content: [
        "Loading any materials other than PREMIER ENERGIES consignments during transit is strictly prohibited. If the consignee reports any such issue to PREMIER ENERGIES, the transporter will forfeit the actual freight cost and shall be subject to additional penalties as deemed appropriate by PREMIER ENERGIES.",
      ],
    },
    {
      header:
        "12. Transporter Liability: Accident / Damage / Robbery / Loading of Third-party Consignment / Illegal Product",
      content: [
        "In case of any damage during transshipment/trans-loading and illegal product transportation, 100% of the value of goods, along with an interest at 12% per annum, will be collected from the transporter if the said damage/loss is not recoverable from the Insurance Company.",
      ],
    },
    {
      header: "13. Return of Damaged Goods",
      content: [
        "The transporter is squarely responsible for returning the damaged goods back at the loading point without any charges. Further, the freight amount will not be paid if the consignment has not reached the designated location within a reasonable transit time, either on account of total damage to goods during transit or for any other reasons whatsoever.",
      ],
    },
    {
      header: "14. POD Submission",
      content: [
        "Transporters are required to submit the Proof of Delivery (POD) within 7 days from the date of delivery at the destination. If the POD is not submitted within this timeframe, a penalty of INR 1,000 will be deducted from the transporter's invoice, starting the day after the deadline. After this period, the penalty will increase to 5% of the freight value. This penalty will continue to accrue daily at the same rate until the POD is provided.",
      ],
    },
    {
      header: "15. Freight Invoice Submission",
      content: [
        "The transporter must raise the freight invoice to PREMIER ENERGIES, including the correct billing address and GST number as specified in the Service Purchase Order provided by the PREMIER ENERGIES logistics team. Invoices will be processed for payment only if they are free of errors and in accordance with the work order.",
      ],
    },
    {
      header: "16. Payment",
      content: [
        "Payment will be made within 60 days from the date of posting the freight bill.",
      ],
    },
    {
      header: "17. MIS",
      content: [
        "Transporters must send specified MIS daily, as per the requirement of PREMIER ENERGIES.",
      ],
    },
    {
      header: "18. Performance Assessment",
      content: [
        "The transporter is required to be present in person for periodic performance assessments regarding the quality of service, as well as discussions on other relevant matters as communicated by PREMIER ENERGIES. The qualitative rating of performance will influence the allocation of business, in addition to considerations of price competitiveness.",
      ],
    },
    {
      header: "19. Force Majeure Clause",
      content: [
        "PREMIER ENERGIES shall not be liable to pay detention charges, loading and unloading charges, or any other costs that have not been previously agreed upon, in the event of unforeseen circumstances such as lockdowns, roadblocks, cyclones, floods, or other delays beyond PREMIER ENERGIES' control.",
      ],
    },
    {
      header: "20. Effective Date and Amendments",
      content: [
        "The above terms are effective from 15th November 2024, until further notice from PREMIER ENERGIES. PREMIER ENERGIES reserves the right to amend these terms with prior notice. Any transporter wishing to discontinue their services must provide prior written notice to PREMIER ENERGIES.",
      ],
    },
    {
      header: "21. Acknowledgment",
      content: [
        "Please acknowledge the receipt and acceptance of the above general terms by clicking the accept button on LEAF.",
      ],
    },
  ];

  return (
    <div className="container mx-auto mt-8 px-4 py-6 bg-transparent rounded-lg shadow-lg">
      <h1 className="text-3xl font-bold mb-4 text-center">
        TERMS AND CONDITIONS FOR DOMESTIC TRANSPORTATION SERVICES
      </h1>
      <div
        className="terms-content bg-white mb-4 p-4 border overflow-y-auto font-chakra"
        style={{ height: "75vh" }}
      >
        {termsAndConditionsContent.map((section, index) => (
          <div key={index} className="mb-4">
            <h2 className="text-xl font-bold mb-2">{section.header}</h2>
            <ul className="list-disc list-inside">
              {section.content.map((point, idx) => (
                <li key={idx} className="mb-2">
                  {point}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TC;
