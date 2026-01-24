import AddAttendanceContent from '@/components/branch/AddAttendanceContent';
import { FaceApiProvider } from '@/context/FaceApiContext';

export default function AttendancePage() {
    return (
        <FaceApiProvider>
            <AddAttendanceContent />
        </FaceApiProvider>
    );
}
