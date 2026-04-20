import { ReactFlowProvider } from 'reactflow';
import CCSFlowView from './CCSFlowView';

export default function CCSFlowWrapper({ code }: { code: string }) {
  return (
    <ReactFlowProvider>
      <CCSFlowView code={code} />
    </ReactFlowProvider>
  );
}