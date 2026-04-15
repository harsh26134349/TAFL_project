
import { useState } from "react";
export default function App(){
  const [msg,setMsg]=useState("DFA Minimizer Ready");
  return <h1>{msg}</h1>
}
