import PropTypes from "prop-types";
import { useEffect, useState } from "react";
import axios from "axios";

const API = window.location.origin;

const formatDateTime = (value) => {
  if (!value) return "-";

  try {
    return new Date(value).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return value;
  }
};

const formatNumber = (value, fractionDigits = 2) => {
  if (value === null || value === undefined || value === "") return "-";

  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return "-";

  return new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: fractionDigits,
  }).format(numericValue);
};

const DataSourceBadge = ({ value }) => (
  <span
    className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold uppercase tracking-wide ${
      value === "captured"
        ? "bg-emerald-100 text-emerald-800"
        : "bg-amber-100 text-amber-800"
    }`}
  >
    {value || "unknown"}
  </span>
);

const ReportSection = ({
  title,
  description,
  rows,
  exportKey,
  columns,
  emptyMessage,
}) => {
  const handleExport = () => {
    window.open(
      `${API}/api/admin/reports/finalization-alerts/${exportKey}.xlsx`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">{title}</h2>
          <p className="mt-1 text-sm text-gray-600">{description}</p>
        </div>

        <button
          type="button"
          onClick={handleExport}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          Export XLSX
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-slate-100">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-700"
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-200 bg-white">
            {rows.length > 0 ? (
              rows.map((row) => (
                <tr key={`${exportKey}-${row.rfqId}`} className="align-top">
                  {columns.map((column) => (
                    <td
                      key={`${exportKey}-${row.rfqId}-${column.key}`}
                      className={`px-4 py-3 text-sm text-gray-800 ${
                        column.className || ""
                      }`}
                    >
                      {column.render
                        ? column.render(row)
                        : row[column.key] !== undefined &&
                          row[column.key] !== null &&
                          row[column.key] !== ""
                        ? row[column.key]
                        : "-"}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-8 text-center text-sm text-gray-500"
                >
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
};

DataSourceBadge.propTypes = {
  value: PropTypes.string,
};

ReportSection.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  rows: PropTypes.arrayOf(PropTypes.object).isRequired,
  exportKey: PropTypes.string.isRequired,
  columns: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      className: PropTypes.string,
      render: PropTypes.func,
    })
  ).isRequired,
  emptyMessage: PropTypes.string.isRequired,
};

const AdminAlertReports = () => {
  const [reportData, setReportData] = useState({
    generatedAt: null,
    allocationMismatchRows: [],
    budgetExceededRows: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchReports = async () => {
    try {
      setIsLoading(true);
      setError("");

      const response = await axios.get(
        `${API}/api/admin/reports/finalization-alerts`
      );
      setReportData(response.data);
    } catch (fetchError) {
      console.error("Error fetching admin alert reports:", fetchError);
      setError("Failed to load admin alert reports.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const mismatchColumns = [
    {
      key: "finalizedAt",
      label: "Finalized At",
      className: "whitespace-nowrap",
      render: (row) => formatDateTime(row.finalizedAt),
    },
    {
      key: "rfqNumber",
      label: "RFQ",
      className: "whitespace-nowrap font-semibold text-gray-900",
    },
    { key: "customerName", label: "Customer" },
    { key: "projectCode", label: "Project Code", className: "whitespace-nowrap" },
    {
      key: "numberOfVehicles",
      label: "Vehicles",
      className: "whitespace-nowrap",
      render: (row) => formatNumber(row.numberOfVehicles, 0),
    },
    {
      key: "totalLeafPrice",
      label: "LEAF Total",
      className: "whitespace-nowrap",
      render: (row) => formatNumber(row.totalLeafPrice),
    },
    {
      key: "totalLogisticsPrice",
      label: "Logistics Total",
      className: "whitespace-nowrap",
      render: (row) => formatNumber(row.totalLogisticsPrice),
    },
    {
      key: "priceDelta",
      label: "Delta",
      className: "whitespace-nowrap",
      render: (row) => formatNumber(row.priceDelta),
    },
    {
      key: "dropLocation",
      label: "Drop Location",
      className: "min-w-[18rem] whitespace-pre-wrap",
    },
    {
      key: "finalizeReason",
      label: "Reason",
      className: "min-w-[18rem] whitespace-pre-wrap",
    },
    {
      key: "leafAllocationSummary",
      label: "LEAF Allocation",
      className: "min-w-[20rem] whitespace-pre-wrap",
    },
    {
      key: "logisticsAllocationSummary",
      label: "Logistics Allocation",
      className: "min-w-[20rem] whitespace-pre-wrap",
    },
    {
      key: "dataSource",
      label: "Source",
      className: "whitespace-nowrap",
      render: (row) => <DataSourceBadge value={row.dataSource} />,
    },
  ];

  const budgetColumns = [
    {
      key: "finalizedAt",
      label: "Finalized At",
      className: "whitespace-nowrap",
      render: (row) => formatDateTime(row.finalizedAt),
    },
    {
      key: "rfqNumber",
      label: "RFQ",
      className: "whitespace-nowrap font-semibold text-gray-900",
    },
    { key: "customerName", label: "Customer" },
    { key: "projectCode", label: "Project Code", className: "whitespace-nowrap" },
    {
      key: "mw",
      label: "MW",
      className: "whitespace-nowrap",
      render: (row) => formatNumber(row.mw, 3),
    },
    {
      key: "budgetedPriceInrPerWp",
      label: "Budgeted INR/Wp",
      className: "whitespace-nowrap",
      render: (row) => formatNumber(row.budgetedPriceInrPerWp, 4),
    },
    {
      key: "finalPriceInrPerWp",
      label: "Final INR/Wp",
      className: "whitespace-nowrap",
      render: (row) => formatNumber(row.finalPriceInrPerWp, 4),
    },
    {
      key: "varianceInrPerWp",
      label: "Variance",
      className: "whitespace-nowrap",
      render: (row) => formatNumber(row.varianceInrPerWp, 4),
    },
    {
      key: "totalLogisticsPrice",
      label: "Finalized Freight",
      className: "whitespace-nowrap",
      render: (row) => formatNumber(row.totalLogisticsPrice),
    },
    {
      key: "salesOrderSiteLocation",
      label: "Sales Site",
      className: "min-w-[14rem] whitespace-pre-wrap",
    },
    {
      key: "logisticsAllocationSummary",
      label: "Logistics Allocation",
      className: "min-w-[20rem] whitespace-pre-wrap",
    },
    {
      key: "dataSource",
      label: "Source",
      className: "whitespace-nowrap",
      render: (row) => <DataSourceBadge value={row.dataSource} />,
    },
  ];

  if (isLoading) {
    return (
      <div className="container mx-auto mt-8 px-4 py-6">
        <div className="flex h-64 items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-green-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto mt-8 space-y-6 px-4 py-6">
      <section className="rounded-2xl bg-white p-6 shadow-lg">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Admin Alert Reports
            </h1>
            <p className="mt-2 max-w-3xl text-sm text-gray-600">
              These reports list finalized RFQs where the system would have
              triggered management email alerts for allocation mismatch or
              budget-overrun conditions.
            </p>
          </div>

          <div className="text-sm text-gray-500">
            Generated: {formatDateTime(reportData.generatedAt)}
          </div>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
              Allocation Mismatch Alerts
            </p>
            <p className="mt-2 text-3xl font-bold text-emerald-900">
              {formatNumber(reportData.allocationMismatchRows.length, 0)}
            </p>
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm font-semibold uppercase tracking-wide text-amber-700">
              Budget Exceeded Alerts
            </p>
            <p className="mt-2 text-3xl font-bold text-amber-900">
              {formatNumber(reportData.budgetExceededRows.length, 0)}
            </p>
          </div>
        </div>

        <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
          Rows marked <strong>captured</strong> come from finalization snapshots
          saved on the RFQ. Rows marked <strong>reconstructed</strong> were
          derived from finalized RFQ and quote data for older records that
          predate this snapshot.
        </div>

        {error ? (
          <div className="mt-5 flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 p-4 md:flex-row md:items-center md:justify-between">
            <p className="text-sm font-medium text-red-700">{error}</p>
            <button
              type="button"
              onClick={fetchReports}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        ) : null}
      </section>

      <ReportSection
        title="Allocation Mismatch Cases"
        description="Cases where LEAF allocation and logistics allocation differed at finalization."
        rows={reportData.allocationMismatchRows}
        exportKey="allocation-mismatch"
        columns={mismatchColumns}
        emptyMessage="No allocation mismatch alerts were found."
      />

      <ReportSection
        title="Budget Exceeded Cases"
        description="Cases where the finalized INR/Wp exceeded the budgeted price from the linked sales order."
        rows={reportData.budgetExceededRows}
        exportKey="budget-exceeded"
        columns={budgetColumns}
        emptyMessage="No budget exceeded alerts were found."
      />
    </div>
  );
};

export default AdminAlertReports;
