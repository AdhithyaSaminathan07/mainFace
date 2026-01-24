import DashboardContent from '@/components/branch/DashboardContent';
import { FaceApiProvider } from '@/context/FaceApiContext';

export default function Page() {
  return (
    <FaceApiProvider>
      <DashboardContent />
    </FaceApiProvider>
  );
}
