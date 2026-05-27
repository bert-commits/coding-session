"use client";

import { useState } from "react";

const BUTTONS = [
  ["C", "+/-", "%", "÷"],
  ["7", "8", "9", "×"],
  ["4", "5", "6", "−"],
  ["1", "2", "3", "+"],
  ["0", ".", "="],
];

type Op = "÷" | "×" | "−" | "+";

export default function CalculatorPage() {
  const [display, setDisplay] = useState("0");
  const [prev, setPrev] = useState<number | null>(null);
  const [op, setOp] = useState<Op | null>(null);
  const [fresh, setFresh] = useState(false);

  const calculate = (a: number, b: number, operator: Op): number => {
    switch (operator) {
      case "+": return a + b;
      case "−": return a - b;
      case "×": return a * b;
      case "÷": return b !== 0 ? a / b : 0;
    }
  };

  const format = (n: number) => {
    const s = parseFloat(n.toPrecision(12)).toString();
    return s.length > 12 ? parseFloat(n.toExponential(6)).toString() : s;
  };

  const handleButton = (btn: string) => {
    if (btn === "C") {
      setDisplay("0");
      setPrev(null);
      setOp(null);
      setFresh(false);
      return;
    }

    if (btn === "+/-") {
      setDisplay((d) => d.startsWith("-") ? d.slice(1) : "-" + d);
      return;
    }

    if (btn === "%") {
      setDisplay((d) => format(parseFloat(d) / 100));
      return;
    }

    if (["÷", "×", "−", "+"].includes(btn)) {
      setPrev(parseFloat(display));
      setOp(btn as Op);
      setFresh(true);
      return;
    }

    if (btn === "=") {
      if (prev !== null && op) {
        const result = calculate(prev, parseFloat(display), op);
        setDisplay(format(result));
        setPrev(null);
        setOp(null);
        setFresh(false);
      }
      return;
    }

    if (btn === ".") {
      const base = fresh ? "0" : display;
      if (!base.includes(".")) setDisplay(base + ".");
      setFresh(false);
      return;
    }

    // Digit
    setDisplay((d) => {
      if (fresh || d === "0") { setFresh(false); return btn; }
      return d.length >= 12 ? d : d + btn;
    });
  };

  const isOp = (btn: string) => ["÷", "×", "−", "+"].includes(btn);
  const isActive = (btn: string) => isOp(btn) && btn === op && fresh;

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="bg-black rounded-3xl overflow-hidden w-80 shadow-2xl">

        {/* Display */}
        <div className="px-6 pt-8 pb-4 text-right">
          <div className="text-gray-400 text-sm h-5 mb-1">
            {prev !== null && op ? `${prev} ${op}` : ""}
          </div>
          <div className="text-white font-light overflow-hidden"
            style={{ fontSize: display.length > 9 ? "2rem" : "3.5rem", lineHeight: 1.1 }}>
            {display}
          </div>
        </div>

        {/* Buttons */}
        <div className="grid grid-cols-4 gap-px bg-gray-700 border-t border-gray-700">
          {BUTTONS.flat().map((btn, i) => {
            const isZero = btn === "0";
            const isFuncRow = ["C", "+/-", "%"].includes(btn);
            const isEquals = btn === "=";

            return (
              <button
                key={i}
                onClick={() => handleButton(btn)}
                className={[
                  isZero ? "col-span-2" : "",
                  "h-20 text-2xl font-light flex items-center justify-center transition active:brightness-75 select-none",
                  isZero ? "justify-start pl-8" : "justify-center",
                  isOp(btn) || isEquals
                    ? isActive(btn)
                      ? "bg-white text-orange-500"
                      : "bg-orange-500 text-white hover:bg-orange-400"
                    : isFuncRow
                    ? "bg-gray-400 text-black hover:bg-gray-300"
                    : "bg-gray-800 text-white hover:bg-gray-700",
                ].join(" ")}
              >
                {btn}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
