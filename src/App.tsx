import { useState, useRef, useEffect } from "react";
import { Send, ShoppingBag, ShieldCheck, AlertCircle, Clock, RefreshCw, HandCoins, PiggyBank, Gamepad2, Brain, Wrench, Ticket, Handshake, Wallet, X, Plus, Trash2 } from "lucide-react";
import Markdown from "react-markdown";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { createSmartShopperChat, Pillar, Verdict } from "./services/gemini";

type Message = {
  id: string;
  role: "user" | "model";
  text: string;
};

type BudgetCategory = { id: string; name: string; amount: number };

const PILLARS: { id: Pillar; label: string; icon: React.ElementType } = [
  { id: "Plan", label: "Plan", icon: Clock },
  { id: "Compare", label: "Compare", icon: RefreshCw },
  { id: "Budget", label: "Budget", icon: HandCoins },
  { id: "Use Cash", label: "Use Cash", icon: HandCoins },
  { id: "Save First", label: "Save First", icon: PiggyBank },
  { id: "Keep Busy", label: "Keep Busy", icon: Gamepad2 },
  { id: "Be Rational", label: "Be Rational", icon: Brain },
  { id: "Be Creative", label: "Be Creative", icon: Wrench },
  { id: "Think Experiences", label: "Think Experiences", icon: Ticket },
  { id: "Negotiate", label: "Negotiate", icon: Handshake },
];

export default function App() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "model",
      text: "Hi! I'm Smart Shopper, your independent spending wingman. What are you thinking about buying today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [verdict, setVerdict] = useState<Verdict>("Evaluating");
  const [activePillars, setActivePillars] = useState<Pillar[]>([]);
  
  const [budgets, setBudgets] = useState<BudgetCategory[]>(() => {
    const saved = localStorage.getItem('smart-shopper-budgets');
    return saved ? JSON.parse(saved) : [
      { id: '1', name: 'Groceries', amount: 500 },
      { id: '2', name: 'Entertainment', amount: 150 },
      { id: '3', name: 'Clothing', amount: 100 },
    ];
  });
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newCatAmount, setNewCatAmount] = useState("");

  const chatRef = useRef<ReturnType<typeof createSmartShopperChat> | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const budgetContext = budgets.map(b => `- ${b.name}: $${b.amount}`).join('\n');
    chatRef.current = createSmartShopperChat(budgetContext);
  }, []);

  useEffect(() => {
    localStorage.setItem('smart-shopper-budgets', JSON.stringify(budgets));
  }, [budgets]);

  const handleAddCategory = () => {
    if (!newCatName.trim() || !newCatAmount || isNaN(Number(newCatAmount))) return;
    setBudgets([...budgets, { id: Date.now().toString(), name: newCatName.trim(), amount: Number(newCatAmount) }]);
    setNewCatName("");
    setNewCatAmount("");
  };

  const handleRemoveCategory = (id: string) => {
    setBudgets(budgets.filter(b => b.id !== id));
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userText = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { id: Date.now().toString(), role: "user", text: userText }]);
    setIsLoading(true);

    try {
      if (!chatRef.current) {
        chatRef.current = createSmartShopperChat();
      }
      
      const response = await chatRef.current.sendMessage({ message: userText });
      const responseText = response.text;
      
      if (responseText) {
        try {
          // The response is expected to be JSON string
          const data = JSON.parse(responseText);
          setMessages((prev) => [
            ...prev,
            { id: Date.now().toString(), role: "model", text: data.message },
          ]);
          if (data.verdict) setVerdict(data.verdict as Verdict);
          if (data.activePillars) setActivePillars(data.activePillars as Pillar[]);
        } catch (e) {
          // Fallback if not valid JSON
          setMessages((prev) => [
            ...prev,
            { id: Date.now().toString(), role: "model", text: responseText },
          ]);
        }
      }
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages((prev) => [
        ...prev,
        { id: Date.now().toString(), role: "model", text: "Sorry, I encountered an error. Let's try that again." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const getVerdictColor = (v: Verdict) => {
    switch (v) {
      case "Proceed": return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "Pause": return "bg-amber-100 text-amber-800 border-amber-200";
      case "Pivot": return "bg-indigo-100 text-indigo-800 border-indigo-200";
      default: return "bg-slate-100 text-slate-800 border-slate-200";
    }
  };

  const getVerdictIcon = (v: Verdict) => {
    switch (v) {
      case "Proceed": return <ShieldCheck className="w-5 h-5" />;
      case "Pause": return <Clock className="w-5 h-5" />;
      case "Pivot": return <RefreshCw className="w-5 h-5" />;
      default: return <AlertCircle className="w-5 h-5" />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900">
      {/* Sidebar */}
      <div className="w-80 bg-white border-r border-slate-200 flex flex-col hidden md:flex">
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-sm">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-semibold text-lg leading-tight">Smart Shopper</h1>
              <p className="text-xs text-slate-500 font-medium">Your Spending Wingman</p>
            </div>
          </div>
        </div>

        <div className="p-6 border-b border-slate-200">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Current Verdict</h2>
          <div className={`flex items-center gap-3 p-4 rounded-xl border ${getVerdictColor(verdict)} transition-colors duration-300`}>
            {getVerdictIcon(verdict)}
            <span className="font-semibold text-sm tracking-wide uppercase">{verdict}</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Evaluation Pillars</h2>
          <div className="space-y-2">
            {PILLARS.map((pillar) => {
              const isActive = activePillars.includes(pillar.id);
              const Icon = pillar.icon;
              return (
                <div 
                  key={pillar.id}
                  className={`flex items-center gap-3 p-3 rounded-lg text-sm transition-all duration-300 ${
                    isActive 
                      ? "bg-indigo-50 text-indigo-700 font-medium border border-indigo-100" 
                      : "text-slate-500 hover:bg-slate-50 border border-transparent"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-indigo-600" : "text-slate-400"}`} />
                  {pillar.label}
                  {isActive && <div className="ml-auto w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />}
                </div>
              );
            })}
          </div>
        </div>

        <div className="p-4 border-t border-slate-200">
          <button
            onClick={() => setIsBudgetModalOpen(true)}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium transition-colors"
          >
            <Wallet className="w-4 h-4" />
            Manage Budget
          </button>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <div className="md:hidden p-4 bg-white border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <span className="font-semibold">Smart Shopper</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setIsBudgetModalOpen(true)} className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg">
              <Wallet className="w-5 h-5" />
            </button>
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold ${getVerdictColor(verdict)}`}>
              {getVerdictIcon(verdict)}
              <span className="uppercase">{verdict}</span>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-3xl mx-auto space-y-6">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-4 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                  msg.role === "user" ? "bg-slate-800 text-white" : "bg-indigo-100 text-indigo-600"
                }`}>
                  {msg.role === "user" ? <span className="text-xs font-medium">You</span> : <ShoppingBag className="w-4 h-4" />}
                </div>
                <div className={`max-w-[80%] rounded-2xl p-5 ${
                  msg.role === "user" 
                    ? "bg-slate-800 text-white rounded-tr-sm" 
                    : "bg-white border border-slate-200 shadow-sm rounded-tl-sm prose prose-slate prose-sm max-w-none"
                }`}>
                  {msg.role === "user" ? (
                    <p className="m-0">{msg.text}</p>
                  ) : (
                    <div className="markdown-body">
                      <Markdown>{msg.text}</Markdown>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                  <ShoppingBag className="w-4 h-4" />
                </div>
                <div className="bg-white border border-slate-200 shadow-sm rounded-2xl rounded-tl-sm p-5 flex gap-1 items-center">
                  <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className="p-4 md:p-6 bg-white border-t border-slate-200">
          <div className="max-w-3xl mx-auto relative">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Tell me what you want to buy..."
              className="w-full pl-5 pr-14 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none min-h-[60px] max-h-[200px]"
              rows={1}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="absolute right-3 bottom-3 p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
          <p className="text-center text-xs text-slate-400 mt-3">
            Smart Shopper helps you make better financial decisions. Not financial advice.
          </p>
        </div>
      </div>

      {/* Budget Modal */}
      {isBudgetModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 md:p-6 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center">
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-semibold text-lg">Budget Dashboard</h2>
                  <p className="text-xs text-slate-500">Manage your monthly spending limits</p>
                </div>
              </div>
              <button onClick={() => setIsBudgetModalOpen(false)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4 md:p-6 overflow-y-auto flex-1">
              {budgets.length > 0 ? (
                <div className="h-64 mb-8">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={budgets} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={(value) => `$${value}`} />
                      <Tooltip 
                        cursor={{ fill: '#f1f5f9' }}
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        formatter={(value: number) => [`$${value}`, 'Budget']}
                      />
                      <Bar dataKey="amount" fill="#4f46e5" radius={[4, 4, 0, 0]} maxBarSize={50} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-64 mb-8 flex items-center justify-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <p className="text-slate-400 text-sm">No budget categories added yet.</p>
                </div>
              )}

              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">Categories</h3>
                
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="Category (e.g. Dining)" 
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  />
                  <input 
                    type="number" 
                    placeholder="Amount ($)" 
                    value={newCatAmount}
                    onChange={(e) => setNewCatAmount(e.target.value)}
                    className="w-32 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  />
                  <button 
                    onClick={handleAddCategory}
                    disabled={!newCatName.trim() || !newCatAmount}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center gap-1 text-sm font-medium"
                  >
                    <Plus className="w-4 h-4" /> Add
                  </button>
                </div>

                <div className="space-y-2 mt-4">
                  {budgets.map(b => (
                    <div key={b.id} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg shadow-sm">
                      <span className="font-medium text-sm text-slate-700">{b.name}</span>
                      <div className="flex items-center gap-4">
                        <span className="text-sm font-semibold text-slate-900">${b.amount}</span>
                        <button 
                          onClick={() => handleRemoveCategory(b.id)}
                          className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
