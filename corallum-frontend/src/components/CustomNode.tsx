import React, { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import { Zap, Code, Database, Globe, MessageSquare, Play, GitBranch, Clock, CheckCircle, Calendar, Repeat, CheckCircle2, AlertCircle, Mail, Server, Webhook, Bot, ArrowRight, ArrowDownRight, RotateCw, Menu, Shield, Key, Link, Users, Building, CreditCard, Briefcase, Layout, Cpu, Cloud, Download, Upload, Filter, Search, Bell, Camera, Map, Navigation, Settings, Wifi, HardDrive, Terminal, Package, Lock, Unlock, Eye, EyeOff, Edit3, Save, Trash2, Copy, ExternalLink, Home, User, Star, Heart, Share2, DownloadCloud, UploadCloud, Smartphone, Tablet, Monitor, Tv, Radio, Headphones, Speaker, Volume2, Mic, Video, CameraOff, Phone, Send, Paperclip, Image, File, Folder, FolderOpen, Archive, FilePlus, FileMinus, ChevronRight, ChevronDown, ChevronUp, ChevronLeft, MoreVertical, MoreHorizontal, Plus, Minus, X, Check, AlertTriangle, Info, HelpCircle, TrendingUp, TrendingDown, BarChart, PieChart, Activity, Battery, WifiOff, FileText } from "lucide-react";

const getCategoryFromType = (type: string): string => {
  const triggers = ["webhook", "schedule", "manual", "trigger"];
  const operators = ["action", "branch", "loop", "script", "approval", "delay", "error", "flow"];
  const integrations = ["http", "database", "slack", "email", "file", "api", "telegram", "payment"];
  const resources = ["model", "memory", "embedding", "aiagent"];
  
  if (triggers.includes(type)) return "trigger";
  if (operators.includes(type)) return "operator";
  if (integrations.includes(type)) return "integration";
  if (resources.includes(type)) return "resource";
  return "default";
};

const categoryColors: Record<string, { border: string; glow: string; bg: string; gradient: string; icon: string; }> = {
  trigger: { border: "#ff6d4a", glow: "rgba(255, 109, 74, 0.3)", bg: "rgba(255, 109, 74, 0.1)", gradient: "linear-gradient(135deg, rgba(255, 109, 74, 0.4) 0%, rgba(255, 154, 0, 0.3) 100%)", icon: "#ff6d4a" },
  operator: { border: "#1e90ff", glow: "rgba(30, 144, 255, 0.3)", bg: "rgba(30, 144, 255, 0.1)", gradient: "linear-gradient(135deg, rgba(30, 144, 255, 0.4) 0%, rgba(0, 191, 255, 0.3) 100%)", icon: "#1e90ff" },
  integration: { border: "#00d4aa", glow: "rgba(0, 212, 170, 0.3)", bg: "rgba(0, 212, 170, 0.1)", gradient: "linear-gradient(135deg, rgba(0, 212, 170, 0.4) 0%, rgba(0, 245, 196, 0.3) 100%)", icon: "#00d4aa" },
  resource: { border: "#8b5cf6", glow: "rgba(139, 92, 246, 0.3)", bg: "rgba(139, 92, 246, 0.1)", gradient: "linear-gradient(135deg, rgba(139, 92, 246, 0.4) 0%, rgba(168, 85, 247, 0.3) 100%)", icon: "#8b5cf6" },
  default: { border: "#64748b", glow: "rgba(100, 116, 139, 0.3)", bg: "rgba(100, 116, 139, 0.1)", gradient: "linear-gradient(135deg, rgba(100, 116, 139, 0.4) 0%, rgba(148, 163, 184, 0.3) 100%)", icon: "#64748b" }
};

const getNodeShape = (type: string): "default" | "trigger" | "configuration" | "configurable" => {
  const normalizedType = type.toLowerCase().trim();
  if (["webhook", "schedule", "manual", "trigger"].includes(normalizedType)) return "trigger";
  if (normalizedType === "aiagent" || normalizedType.includes("ai agent")) return "configuration";
  return "configurable";
};

const getIcon = (type: string, label: string, size: number = 24) => {
  const l = label.toLowerCase();
  const t = type.toLowerCase();
  
  if (t === "aiagent" || l.includes("ai agent")) return <Bot size={size} />;
  if (t === "webhook" || l.includes("webhook")) return <Webhook size={size} />;
  if (t === "schedule" || l.includes("schedule")) return <Calendar size={size} />;
  if (t === "manual" || l.includes("manual")) return <Zap size={size} />;
  if (t === "email" || l.includes("email")) return <Mail size={size} />;
  if (t === "database" || l.includes("database")) return <Database size={size} />;
  if (t === "http" || l.includes("http")) return <Globe size={size} />;
  if (t === "api" || l.includes("api")) return <Server size={size} />;
  if (t === "script" || l.includes("script")) return <Code size={size} />;
  if (t === "branch" || l.includes("branch")) return <GitBranch size={size} />;
  if (t === "loop" || l.includes("loop")) return <Repeat size={size} />;
  if (t === "delay" || l.includes("delay")) return <Clock size={size} />;
  if (t === "approval" || l.includes("approval")) return <CheckCircle2 size={size} />;
  if (t === "error" || l.includes("error")) return <AlertCircle size={size} />;
  if (t === "file" || l.includes("file")) return <FileText size={size} />;
  if (t === "payment" || l.includes("payment")) return <CreditCard size={size} />;
  if (t === "slack" || l.includes("slack")) return <MessageSquare size={size} />;
  if (t === "telegram" || l.includes("telegram")) return <Send size={size} />;
  
  return <Play size={size} />;
};

export const CustomNode = memo(({ data, selected }: any) => {
  const nodeType = data.type || "default";
  const category = getCategoryFromType(nodeType);
  const shape = getNodeShape(nodeType);
  const colors = categoryColors[category];
  const isConnected = data.isConnected || false;
  const hasOutput = data.hasOutput || false;
  const hasConnectedOutput = data.hasConnectedOutput || false;

  const nodeClasses = [
    "futuristic-node",
    `node-${shape}`,
    `node-category-${category}`,
    selected ? "selected" : "",
    hasConnectedOutput ? "success" : "",
    data.disabled ? "disabled" : "",
    data.running ? "running" : "",
    data.waiting ? "waiting" : "",
    data.error ? "error" : "",
    data.pinned ? "pinned" : ""
  ].filter(Boolean).join(" ");

  // ÑÀÌÛÅ ÏĞÎÑÒÛÅ ĞÀÇÌÅĞÛ - ÏĞßÌÎ Â ÑÒÈËÅ
  const nodeStyle = {
    "--node-border-color": colors.border,
    "--node-glow-color": colors.glow,
    "--node-bg-color": colors.bg,
    "--node-gradient": colors.gradient,
    "--node-icon-color": colors.icon,
    // ÏĞßÌÛÅ ğàçìåğû áåç CSS ïåğåìåííûõ
    width: shape === "configuration" ? "180px" : "80px",
    height: "80px",
    minWidth: shape === "configuration" ? "180px" : "80px",
    minHeight: "80px",
    maxWidth: shape === "configuration" ? "180px" : "80px",
    maxHeight: "80px",
    borderRadius: shape === "trigger" ? "40px 8px 8px 40px" : "8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    background: "rgba(255, 255, 255, 0.08)",
    backdropFilter: "blur(12px)",
    border: "2px solid " + colors.border,
    boxShadow: "0 0 20px " + colors.glow + ", 0 4px 12px rgba(0, 0, 0, 0.15)",
    transition: "all 0.3s ease",
    cursor: "pointer",
    overflow: "visible"
  } as React.CSSProperties;

  // ÓÌÅÍÜØÅÍÍÛÉ ğàçìåğ èêîíîê
  const iconSize = 20;

  return (
    <div className={nodeClasses} style={nodeStyle}>
      {shape === "trigger" ? (
        <Handle type="source" position={Position.Right} className="handle-neon handle-trigger" />
      ) : (
        <>
          <Handle type="target" position={Position.Left} className="handle-neon handle-input" />
          <Handle type="source" position={Position.Right} className="handle-neon handle-output" />
        </>
      )}

      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        height: "100%",
        position: "relative"
      }}>
        {/* ÒÎËÜÊÎ ÈÊÎÍÊÀ - ÁÅÇ ÍÀÄÏÈÑÅÉ ÂÎ ÂÑÅÕ ÌÎÄÓËßÕ */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: colors.icon
        }}>
          {getIcon(nodeType, data.label || "", iconSize)}
        </div>

        {/* ÑÒÀÒÓÑÛ */}
        <div style={{
          position: "absolute",
          top: "4px",
          right: "4px",
          display: "flex",
          gap: "2px"
        }}>
          {hasConnectedOutput && (
            <CheckCircle size={12} style={{ color: "#10b981" }} />
          )}
          {data.running && (
            <div style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              background: "#f59e0b",
              animation: "pulse 2s infinite"
            }} />
          )}
          {data.error && (
            <AlertCircle size={12} style={{ color: "#ef4444" }} />
          )}
          {data.pinned && (
            <Star size={10} style={{ color: "#f59e0b" }} />
          )}
        </div>
      </div>

      {(data.running || data.waiting) && (
        <div style={{
          position: "absolute",
          top: "-2px",
          left: "-2px",
          right: "-2px",
          bottom: "-2px",
          borderRadius: shape === "trigger" ? "40px 8px 8px 40px" : "8px",
          background: data.running 
            ? "conic-gradient(from 0deg, #f59e0b, #f59e0b 90%, transparent 90%, transparent)"
            : "conic-gradient(from 0deg, #3b82f6, #3b82f6 90%, transparent 90%, transparent)",
          animation: "spin 3s linear infinite",
          zIndex: -1
        }} />
      )}
    </div>
  );
});

CustomNode.displayName = "CustomNode";
