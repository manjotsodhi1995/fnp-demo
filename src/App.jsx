import { useState, useRef, useEffect } from "react";

// ─── MULTI-TURN MOCK ENGINE ──────────────────────────────────────────────────
// Each scenario tracks which "turn" the user is on and responds accordingly

const FLOWS = {
  // ORDER TRACKING - FNP-78231
  "track": [
    `Good news — your **Red Rose Bouquet** (Order **#FNP-78231**) is out for delivery! 🌹 It's with our partner **Bloom Florist Delhi** and expected between **6pm–8pm today**. There's a slight delay due to high order volume this week. Would you like the delivery partner's contact number?`,
    `Of course! Our delivery executive **Rajesh Kumar** can be reached at **9810XXXXX**. He's currently on his route and your order is next in his queue. Is there a specific time window that works better for you?`,
    `Noted! I've added a note to prioritize your delivery after 7pm. Rajesh will call you 15 minutes before arrival. Is there anything else I can help you with? 🌸`,
    `You're all set! Your bouquet is on its way. If there are any further issues, don't hesitate to reach out — we're available 7am–1am daily. Have a wonderful day! 🌹`,
  ],

  // DAMAGED DELIVERY - FNP-65490
  "damaged": [
    `I'm so sorry to hear your **Chocolate Truffle Cake** arrived damaged — especially for your mom's birthday. 😔 This is absolutely not the experience we want for you. I've flagged Order **#FNP-65490** as a priority complaint. Could you share a photo of the damaged item so I can initiate a replacement immediately?`,
    `Thank you for sharing that. I've raised an **urgent replacement request** with Sweet Layers Bakery. You have two options: a **fresh cake delivered within 3 hours** or a **full refund within 24 hours**. Which would you prefer? 🌸`,
    `Perfect, I've initiated your **full refund** for ₹1,299. It will reflect in your original payment method within **24 hours**. You'll receive an SMS confirmation shortly. On behalf of FNP, I sincerely apologize for ruining this special moment. 💐`,
    `Your refund is confirmed and being processed. We're also sending you a **₹200 gift voucher** for your next order as a goodwill gesture. We hope to make it up to you! Is there anything else I can help with? 🌸`,
  ],

  // REFUND - FNP-91045
  "refund": [
    `I completely understand your frustration — you paid for **Same Day delivery** and that commitment wasn't honored for Order **#FNP-91045**. 😔 Your **Personalized Gift Hamper** is now expected tomorrow between 10am–12pm due to a stock issue at Giftify Partners. You are absolutely eligible for a refund. Would you like a **refund of the express delivery charges** or a **full order cancellation**?`,
    `Got it — I've initiated a **full refund of ₹499** (Same Day delivery charges) for Order **#FNP-91045**. This will reflect in your account within **3–5 business days**. Your hamper will still be delivered tomorrow as scheduled. Would you like a confirmation SMS?`,
    `Done! ✅ Refund confirmed and SMS sent to your registered number. Your order is now marked for priority delivery tomorrow. The delivery executive will call you 30 minutes before arrival. Is there anything else? 🌸`,
    `Happy to help! Your order is in safe hands. If you need any further assistance, we're available 7am–1am daily. Have a great day! 🌸`,
  ],

  // VENDOR CANCELLED - FNP-55102
  "cancelled": [
    `I sincerely apologize — your **White Lily Arrangement** (Order **#FNP-55102**) was cancelled by **Petal Palace Florist**, and we failed to notify you in time. That is completely unacceptable and I take full responsibility. ✅ A **full refund** has been initiated and will reflect within **3–5 business days**. You'll receive an SMS and email confirmation shortly.`,
    `I understand your frustration — you had this planned for a reason. Would you like me to **re-order the same arrangement** from an alternate vendor who can deliver **today**? We'll prioritize it at no extra cost as compensation for the inconvenience. 🌸`,
    `I've placed a replacement order with **Bloom Florist Delhi** — your White Lily Arrangement will be delivered by **7pm today** at no additional charge. Order confirmation: **#FNP-55201**. Is the delivery address the same as before?`,
    `Perfect, all confirmed! ✅ Your replacement is on its way and your original refund of ₹1,499 is also being processed in parallel. We truly apologize for the experience. Please rate your support interaction — your feedback helps us improve! 🌸`,
  ],

  // SLOT CHANGE - FNP-78231
  "slot": [
    `I understand you'd like to reschedule the delivery for **#FNP-78231**. Since your order is already out for delivery, I can't change the route — but I can connect you directly with the delivery executive **Rajesh Kumar (9810XXXXX)** to coordinate a convenient time. Would that help?`,
    `I've sent Rajesh a note to call you before arriving and to attempt delivery after **8pm** if possible. He'll do his best to accommodate. If he's unable to reach you, the order will be returned and re-attempted the **next morning at your preferred time**. What time works best for re-delivery?`,
    `Noted — **10am tomorrow** is confirmed as your preferred re-delivery window. I've updated the order notes. You'll receive a call from our team 30 minutes before arrival. Is the delivery address correct? 🌸`,
    `All set! Your delivery is rescheduled for tomorrow morning. If you need to make any further changes, please reach out at least 2 hours before the delivery window. Have a great evening! 🌸`,
  ],

  // GENERAL GREETING
  "greet": [
    `Hello! 🌸 Welcome to FNP Support. I'm **Petal**, your AI assistant. I can help with order tracking, delivery updates, refunds, or any other concern. Could you share your **order number** or tell me what you need help with?`,
    `Of course, I'm happy to help! Could you share a bit more detail about your concern? For example, is it about a delivery delay, product quality, or something else? 🌸`,
    `Got it! Let me look into that for you. To make sure I give you the most accurate update, could you confirm your **registered phone number or email** linked to the order?`,
    `Thank you! I've pulled up your details. Everything looks good on our end — is there anything specific you'd like me to verify or update for you? 🌸`,
  ],

  // REFUND POLICY
  "policy": [
    `Happy to explain our refund policy! 🌸 For **vendor-cancelled orders**, you get a full refund in 3–5 business days. For **damaged or wrong products**, we offer a replacement or refund within 24 hours. For **cancellations made 24hrs before delivery**, you get a full refund. Do any of these apply to your situation?`,
    `I see — in that case, you'd be eligible for a **full refund within 3–5 business days**. The amount will be credited back to your original payment method. Would you like me to initiate that now?`,
    `✅ Refund initiated! You'll receive a confirmation on your registered email and phone shortly. The amount typically reflects within 3 business days. Is there anything else I can help with? 🌸`,
    `You're welcome! If you have any questions about future orders, we're here 7am–1am daily. Have a lovely day! 🌿`,
  ],

  // FALLBACK
  "fallback": [
    `I'm here to help with your FNP orders! 🌸 Could you share your **order number** (format: FNP-XXXXX) so I can look into this for you?`,
    `Let me check that for you. While I search, could you confirm — is this related to a **delivery issue**, a **refund**, or something else? 🌸`,
    `Got it. Based on what you've shared, I'd recommend reaching out with your order number so I can give you a precise update. You can also check order status directly at **fnp.com/track**. 🌸`,
    `I hope that helps! If you need anything else, I'm available 7am–1am daily. Wishing you a wonderful day! 🌸`,
  ],
};

function detectFlow(text) {
  const t = text.toLowerCase();
  if (/human|manager|senior|real person|supervisor|agent/i.test(t)) return "escalate";
  if (/fnp-78231|78231/.test(t) && /slot|change|reschedule|after|later|8pm|evening/i.test(t)) return "slot";
  if (/fnp-78231|78231|where.*order|track|status|arriv/.test(t)) return "track";
  if (/fnp-65490|65490|damage|broken|ruin|cake.*bad|bad.*cake/i.test(t)) return "damaged";
  if (/fnp-91045|91045|refund|same.?day|money back/i.test(t)) return "refund";
  if (/fnp-55102|55102|cancel/i.test(t)) return "cancelled";
  if (/^(hi|hello|hey|namaste|good\s*(morning|evening|afternoon))/i.test(t)) return "greet";
  if (/refund|policy|cancel|money/i.test(t)) return "policy";
  if (/slot|time|deliver|when|arriv|schedul/i.test(t)) return "slot";
  return "fallback";
}

// ─── COMPONENTS ──────────────────────────────────────────────────────────────
const CHIPS = [
  { icon:"🌹", label:"Where is my order?",  msg:"My order FNP-78231 was supposed to arrive by 4pm and it's still not here." },
  { icon:"🎂", label:"Damaged delivery",     msg:"My order FNP-65490 was delivered but the cake was completely damaged. It was for my mom's birthday." },
  { icon:"💸", label:"I want a refund",      msg:"Order FNP-91045 — I paid for same day delivery and now it's coming tomorrow? I need a refund." },
  { icon:"❌", label:"Vendor cancelled",     msg:"My order FNP-55102 was cancelled by vendor and nobody told me. Where is my refund?" },
  { icon:"⏰", label:"Change delivery slot", msg:"Can I change delivery time for FNP-78231 to after 8pm?" },
];

const fmt = t => t.replace(/\*\*(.*?)\*\*/g,"<strong>$1</strong>").replace(/\n/g,"<br/>");

const Dots = () => (
  <div style={{display:"flex",gap:4}}>
    {[0,1,2].map(i=><div key={i} style={{width:7,height:7,borderRadius:"50%",background:"#2E7D32",animation:"dot 1.2s infinite",animationDelay:`${i*0.2}s`}}/>)}
  </div>
);

const EscCard = ({ticket}) => (
  <div style={{background:"#E8F5E9",border:"1.5px solid #4CAF50",borderRadius:12,padding:"14px 16px",marginLeft:38}}>
    <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:8}}>
      <div style={{width:32,height:32,borderRadius:"50%",background:"#2E7D32",display:"flex",alignItems:"center",justifyContent:"center",fontSize:15}}>👤</div>
      <div>
        <div style={{fontWeight:700,color:"#1B5E20",fontSize:13}}>Senior Resolution Specialist</div>
        <div style={{fontSize:11,color:"#4CAF50",fontFamily:"monospace"}}>Human Agent · Priority Queue</div>
      </div>
    </div>
    <p style={{margin:"0 0 10px",fontSize:13,lineHeight:1.6,color:"#1a1a1a"}}>
      Escalated successfully. A specialist will contact you <strong>within 2 hours</strong> via your registered email and phone.
    </p>
    <div style={{display:"flex",gap:8}}>
      <span style={{background:"#fff",border:"1px solid #C8E6C9",borderRadius:6,padding:"3px 10px",fontSize:11,color:"#1B5E20",fontFamily:"monospace"}}>🎫 {ticket}</span>
      <span style={{background:"#fff",border:"1px solid #C8E6C9",borderRadius:6,padding:"3px 10px",fontSize:11,color:"#1B5E20",fontFamily:"monospace"}}>⏱ ETA: 2 hours</span>
    </div>
  </div>
);

// ─── MAIN ────────────────────────────────────────────────────────────────────
export default function FNPDemo() {
  const [messages,  setMessages]  = useState([
    {role:"assistant", content:"Namaste! 🌸 I'm **Petal**, FNP's AI support assistant. I can help with order tracking, delivery updates, and refunds. What can I do for you today?", type:"msg"}
  ]);
  const [input,     setInput]     = useState("");
  const [loading,   setLoading]   = useState(false);
  const [thinkStep, setThinkStep] = useState("");
  const [showChips, setShowChips] = useState(true);
  const [escalated, setEscalated] = useState(false);

  // Track current flow and turn index
  const flowRef  = useRef(null);
  const turnRef  = useRef(0);
  const bottomRef = useRef(null);
  const tickRef   = useRef(null);

  useEffect(()=>{ bottomRef.current?.scrollIntoView({behavior:"smooth"}); },[messages,loading]);

  const stopTick = () => { clearInterval(tickRef.current); setThinkStep(""); };

  const reset = () => {
    stopTick(); setLoading(false); setInput("");
    setShowChips(true); setEscalated(false);
    flowRef.current = null; turnRef.current = 0;
    setMessages([{role:"assistant",content:"Namaste! 🌸 I'm **Petal**, FNP's AI support assistant. I can help with order tracking, delivery updates, and refunds. What can I do for you today?",type:"msg"}]);
  };

  const send = (text) => {
    const t = (text||"").trim();
    if (!t || loading) return;

    if (escalated) {
      setMessages(p=>[...p,
        {role:"user",      content:t, type:"msg"},
        {role:"assistant", content:"Your case is with our Senior Specialist — they'll reach out within 2 hours. Anything specific you'd like me to note for them? 🌿", type:"msg"},
      ]);
      setInput(""); return;
    }

    setShowChips(false);
    setMessages(p=>[...p, {role:"user", content:t, type:"msg"}]);
    setInput("");
    setLoading(true);

    const steps = ["Authenticating...","Checking order database...","Reviewing delivery status...","Applying SOP policies...","Composing response..."];
    let si = 0; setThinkStep(steps[0]);
    tickRef.current = setInterval(()=>{ si=(si+1)%steps.length; setThinkStep(steps[si]); }, 600);

    setTimeout(()=>{
      stopTick(); setLoading(false);

      // Detect flow on first message; stay in flow for follow-ups
      const detectedFlow = detectFlow(t);

      if (detectedFlow === "escalate") {
        const ticket = `ESC-${Math.floor(10000+Math.random()*90000)}`;
        setMessages(p=>[...p, {role:"assistant",content:"I completely understand. Let me connect you with a Senior Resolution Specialist right away. 🌸",type:"msg"}]);
        setTimeout(()=>{
          setMessages(p=>[...p, {role:"assistant",content:"",type:"esc",ticket}]);
          setEscalated(true);
        }, 400);
        return;
      }

      // On first message, set the flow; on follow-ups, stay in current flow
      if (!flowRef.current) {
        flowRef.current = detectedFlow;
        turnRef.current = 0;
      } else {
        turnRef.current = Math.min(turnRef.current + 1, FLOWS[flowRef.current].length - 1);
      }

      const reply = FLOWS[flowRef.current][turnRef.current];
      setMessages(p=>[...p, {role:"assistant", content:reply, type:"msg"}]);

    }, 800 + Math.random()*500);
  };

  return (
    <div style={{background:"#F5F5F5",minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"20px 16px",fontFamily:"Inter,sans-serif"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        *{box-sizing:border-box}
        @keyframes dot{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-6px)}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:translateY(0)}}
        .bbl{animation:fadeIn 0.25s ease}
        .chip:hover{background:#E8F5E9!important;border-color:#2E7D32!important;color:#2E7D32!important}
        .sbtn:hover:not(:disabled){background:#388E3C!important}
        textarea:focus{outline:none}
        .ibox:focus-within{border-color:#2E7D32!important;box-shadow:0 0 0 3px rgba(46,125,50,0.1)!important}
        ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:#ddd;border-radius:4px}
      `}</style>

      {/* Topbar */}
      <div style={{width:"100%",maxWidth:640,marginBottom:10,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <img src="https://www.fnp.com/icons/fnp-gift-new.svg" alt="FNP" style={{height:28}} onError={e=>e.target.style.display="none"}/>
          <div>
            <div style={{fontSize:12,fontWeight:700,color:"#2E7D32"}}>CUSTOMER SUPPORT AI</div>
            <div style={{fontSize:10,color:"#999",fontFamily:"monospace"}}>Powered by Technotribes</div>
          </div>
        </div>
        <div style={{background:"#FFF8E1",border:"1px solid #FFC107",borderRadius:20,padding:"3px 12px",fontSize:11,color:"#795500"}}>🌿 Live Demo</div>
      </div>

      {/* Window */}
      <div style={{width:"100%",maxWidth:640,height:570,background:"#fff",borderRadius:16,border:"1px solid #E0E0E0",boxShadow:"0 4px 20px rgba(0,0,0,0.08)",display:"flex",flexDirection:"column",overflow:"hidden"}}>

        {/* Header */}
        <div style={{background:"#2E7D32",padding:"13px 18px",display:"flex",alignItems:"center",gap:12}}>
          <div style={{position:"relative"}}>
            <div style={{width:38,height:38,borderRadius:"50%",background:"rgba(255,255,255,0.15)",border:"2px solid rgba(255,255,255,0.3)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>🌸</div>
            <div style={{position:"absolute",bottom:1,right:1,width:10,height:10,borderRadius:"50%",background:escalated?"#FFC107":"#69F0AE",border:"2px solid #2E7D32"}}/>
          </div>
          <div style={{flex:1}}>
            <div style={{color:"#fff",fontWeight:700,fontSize:15}}>Petal — FNP Support</div>
            <div style={{color:"rgba(255,255,255,0.65)",fontSize:11,fontFamily:"monospace"}}>{escalated?"Escalated · Specialist assigned":"AI Agent · Resolves in < 30 sec"}</div>
          </div>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            <div style={{background:escalated?"rgba(255,193,7,0.2)":"rgba(105,240,174,0.2)",border:`1px solid ${escalated?"#FFC107":"#69F0AE"}`,borderRadius:20,padding:"2px 9px",fontSize:10,color:escalated?"#FFC107":"#69F0AE",fontFamily:"monospace"}}>{escalated?"⏳ ESCALATED":"● LIVE"}</div>
            <button onClick={reset} style={{background:"rgba(255,255,255,0.12)",border:"1px solid rgba(255,255,255,0.3)",borderRadius:7,padding:"4px 11px",color:"#fff",fontSize:11,cursor:"pointer"}}>↺ New Chat</button>
          </div>
        </div>
        <div style={{height:3,background:"linear-gradient(90deg,#2E7D32,#FFC107,#2E7D32)"}}/>

        {/* Messages */}
        <div style={{flex:1,overflowY:"auto",padding:"16px 16px 8px",display:"flex",flexDirection:"column",gap:12}}>
          {messages.map((m,i)=>{
            if(m.type==="esc") return <div key={i} className="bbl"><EscCard ticket={m.ticket}/></div>;
            const u = m.role==="user";
            return (
              <div key={i} className="bbl" style={{display:"flex",flexDirection:u?"row-reverse":"row",gap:8,alignItems:"flex-end"}}>
                {!u&&<div style={{width:30,height:30,borderRadius:"50%",flexShrink:0,background:"#2E7D32",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}>🌸</div>}
                <div style={{maxWidth:"76%"}}>
                  <div style={{padding:"10px 14px",fontSize:14,lineHeight:"1.6",background:u?"#2E7D32":"#fff",border:u?"none":"1px solid #EBEBEB",borderRadius:u?"15px 15px 3px 15px":"15px 15px 15px 3px",color:u?"#fff":"#1a1a1a",boxShadow:u?"0 2px 6px rgba(46,125,50,0.2)":"0 1px 3px rgba(0,0,0,0.05)"}}
                    dangerouslySetInnerHTML={{__html:fmt(m.content)}}/>
                </div>
              </div>
            );
          })}

          {loading&&(
            <div className="bbl" style={{display:"flex",gap:8,alignItems:"flex-end"}}>
              <div style={{width:30,height:30,borderRadius:"50%",background:"#2E7D32",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}>🌸</div>
              <div style={{padding:"10px 14px",background:"#fff",border:"1px solid #EBEBEB",borderRadius:"15px 15px 15px 3px"}}>
                {thinkStep&&<div style={{fontSize:11,color:"#aaa",fontFamily:"monospace",marginBottom:4}}>⬤ {thinkStep}</div>}
                <Dots/>
              </div>
            </div>
          )}
          <div ref={bottomRef}/>
        </div>

        {/* Chips */}
        {showChips&&!escalated&&(
          <div style={{padding:"4px 16px 10px",display:"flex",flexWrap:"wrap",gap:6}}>
            {CHIPS.map((s,i)=>(
              <button key={i} className="chip" onClick={()=>send(s.msg)} style={{background:"#F9F9F9",border:"1px solid #E0E0E0",borderRadius:20,padding:"5px 12px",fontSize:12,color:"#555",cursor:"pointer",transition:"all 0.15s",display:"flex",alignItems:"center",gap:5}}>
                <span>{s.icon}</span><span>{s.label}</span>
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div style={{padding:"8px 14px 14px",borderTop:"1px solid #F0F0F0"}}>
          {escalated?(
            <div style={{textAlign:"center",fontSize:12,color:"#aaa",fontFamily:"monospace",padding:"8px 0"}}>
              Specialist contacts you within 2 hrs &nbsp;·&nbsp;
              <span onClick={reset} style={{color:"#2E7D32",cursor:"pointer",textDecoration:"underline"}}>Start new chat</span>
            </div>
          ):(
            <div className="ibox" style={{display:"flex",alignItems:"flex-end",gap:8,background:"#F9F9F9",border:"1.5px solid #E0E0E0",borderRadius:11,padding:"8px 8px 8px 13px",transition:"all 0.2s"}}>
              <textarea value={input} onChange={e=>setInput(e.target.value)}
                onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send(input);}}}
                placeholder="Enter your order number or describe your issue..."
                rows={1} style={{flex:1,background:"transparent",border:"none",fontSize:14,color:"#1a1a1a",resize:"none",lineHeight:"1.5",maxHeight:80,caretColor:"#2E7D32"}}/>
              <button className="sbtn" onClick={()=>send(input)} disabled={loading||!input.trim()}
                style={{width:35,height:35,borderRadius:8,border:"none",background:loading||!input.trim()?"#C8E6C9":"#2E7D32",color:"#fff",cursor:loading||!input.trim()?"not-allowed":"pointer",fontSize:15,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"all 0.15s"}}>
                {loading?"⌛":"➤"}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div style={{marginTop:18,display:"flex",gap:36,justifyContent:"center",flexWrap:"wrap"}}>
        {[["<30s","Avg Resolution"],["94%","CSAT Score"],["24/7","Availability"],["50+","Query Types"]].map(([v,l],i)=>(
          <div key={i} style={{textAlign:"center"}}>
            <div style={{fontSize:19,fontWeight:700,color:"#2E7D32"}}>{v}</div>
            <div style={{fontSize:10,color:"#bbb",fontFamily:"monospace"}}>{l}</div>
          </div>
        ))}
      </div>
      <div style={{marginTop:10,fontSize:11,color:"#ccc",fontFamily:"monospace"}}>Built by Technotribes · AI Customer Experience Platform</div>
    </div>
  );
}
