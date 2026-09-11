import OperationsCopilot from '../components/assistant/OperationsCopilot';
import { AppNavBar } from '../components/navigation/AppNavBar';

export default function AIAssistant() {
  return (
    <div className="relative min-h-screen bg-[#c8cfd5] overflow-hidden">
      <AppNavBar />
      <div className="relative z-10 w-full h-screen">
        <OperationsCopilot embedded={true} />
      </div>
    </div>
  );
}
