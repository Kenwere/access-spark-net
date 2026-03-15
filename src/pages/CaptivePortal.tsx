import { useState } from "react";
import { Wifi, Zap, Clock, ArrowRight, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";

const packages = [
  { id: "1", name: "Quick Browse", price: 15, duration: "2 Hours", speed: "5 Mbps", icon: "⚡" },
  { id: "2", name: "Half Day", price: 30, duration: "6 Hours", speed: "10 Mbps", icon: "🌤" },
  { id: "3", name: "Full Day", price: 60, duration: "24 Hours", speed: "20 Mbps", icon: "🌟", popular: true },
  { id: "4", name: "Weekly Pass", price: 350, duration: "7 Days", speed: "20 Mbps", icon: "🚀" },
];

type Step = "select" | "phone" | "pay";

export default function CaptivePortal() {
  const [step, setStep] = useState<Step>("select");
  const [selected, setSelected] = useState<string | null>(null);
  const [phone, setPhone] = useState("");
  const [voucher, setVoucher] = useState("");
  const [showVoucher, setShowVoucher] = useState(false);
  const selectedPkg = packages.find(p => p.id === selected);

  return (
    <div className="min-h-screen dark bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-4">
            <Wifi className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-display font-bold text-foreground">MoonConnect</h1>
          <p className="text-sm text-muted-foreground mt-1">Fast, reliable WiFi access</p>
        </motion.div>

        <AnimatePresence mode="wait">
          {step === "select" && (
            <motion.div key="select" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <h2 className="text-sm font-medium text-muted-foreground mb-3">Choose your plan</h2>
              <div className="space-y-3">
                {packages.map((pkg) => (
                  <button key={pkg.id} onClick={() => setSelected(pkg.id)}
                    className={`w-full glass-card p-4 text-left transition-all duration-200 hover:scale-[1.02] ${selected === pkg.id ? "ring-2 ring-primary shadow-md" : ""} ${pkg.popular ? "relative" : ""}`}>
                    {pkg.popular && <span className="absolute -top-2 right-3 px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary text-primary-foreground">POPULAR</span>}
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{pkg.icon}</span>
                      <div className="flex-1">
                        <p className="font-semibold text-sm">{pkg.name}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5"><Clock className="w-3 h-3" /> {pkg.duration}<span>•</span><Zap className="w-3 h-3" /> {pkg.speed}</div>
                      </div>
                      <p className="font-display font-bold text-lg text-primary">KSH {pkg.price}</p>
                    </div>
                  </button>
                ))}
              </div>
              <Button className="w-full mt-4 bg-primary text-primary-foreground font-medium h-12" disabled={!selected} onClick={() => setStep("phone")}>
                Continue <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <button onClick={() => setShowVoucher(!showVoucher)} className="w-full text-center text-xs text-muted-foreground mt-3 hover:text-primary transition-colors">Have a voucher code?</button>
              {showVoucher && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mt-3 flex gap-2">
                  <Input placeholder="Enter voucher code" value={voucher} onChange={e => setVoucher(e.target.value)} className="font-mono text-sm" />
                  <Button variant="outline">Redeem</Button>
                </motion.div>
              )}
            </motion.div>
          )}

          {step === "phone" && (
            <motion.div key="phone" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div className="glass-card p-5 mb-4">
                <p className="text-xs text-muted-foreground mb-1">Selected package</p>
                <div className="flex items-center justify-between">
                  <p className="font-semibold">{selectedPkg?.name} - {selectedPkg?.duration}</p>
                  <p className="font-display font-bold text-primary">KSH {selectedPkg?.price}</p>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input placeholder="07XXXXXXXX" className="pl-10 h-12 font-mono" value={phone} onChange={e => setPhone(e.target.value)} />
                  </div>
                </div>
                <Button className="w-full bg-primary text-primary-foreground font-medium h-12" disabled={phone.length < 10} onClick={() => setStep("pay")}>
                  Pay Now <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
                <button onClick={() => setStep("select")} className="w-full text-center text-xs text-muted-foreground hover:text-primary transition-colors">← Back to packages</button>
              </div>
            </motion.div>
          )}

          {step === "pay" && (
            <motion.div key="pay" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="text-center">
              <div className="glass-card p-8">
                <div className="w-16 h-16 rounded-full bg-primary/15 flex items-center justify-center mx-auto mb-4">
                  <Wifi className="w-8 h-8 text-primary animate-pulse" />
                </div>
                <h3 className="font-display font-bold text-lg mb-1">Payment Request Sent</h3>
                <p className="text-sm text-muted-foreground mb-4">Check your phone <span className="font-mono text-primary">{phone}</span> for the payment prompt</p>
                <div className="glass-card p-4 text-sm space-y-2 text-left mb-4">
                  <div className="flex justify-between"><span className="text-muted-foreground">Package</span><span>{selectedPkg?.name}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Duration</span><span>{selectedPkg?.duration}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Amount</span><span className="font-display font-bold text-primary">KSH {selectedPkg?.price}</span></div>
                </div>
                <p className="text-xs text-muted-foreground">You'll be connected automatically once payment is confirmed</p>
              </div>
              <button onClick={() => { setStep("select"); setSelected(null); setPhone(""); }} className="text-xs text-muted-foreground hover:text-primary transition-colors mt-4">← Start over</button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
