'use client';

import React, { useState, useEffect } from 'react';
import { 
  loadCSVData,
  PatientRecord,
  ProcedureRecord,
  DoctorRecord,
  formatDate
} from '@/utils/dataProcessing';

// Define types for our data
interface RecentPatient {
  id: string;
  name: string;
  lastVisit: string;
  doctor: string;
  status: string;
}

interface Appointment {
  id: string;
  patient: string;
  dateTime: string;
  doctor: string;
  type: string;
}

const Dashboard = () => {
  const [recentPatients, setRecentPatients] = useState<RecentPatient[]>([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        
        // Load data from CSV files
        const patients = await loadCSVData<PatientRecord>('patients.csv');
        const procedures = await loadCSVData<ProcedureRecord>('procedures.csv');
        const doctors = await loadCSVData<DoctorRecord>('doctors.csv');
        
        // Process recent patients (most recent procedures)
        const sortedProcedures = [...procedures].sort((a, b) => {
          return new Date(b['Date of Service']).getTime() - new Date(a['Date of Service']).getTime();
        });
        
        // Get unique patients from recent procedures
        const uniquePatientIds = new Set<string>();
        const recentPatientProcedures: ProcedureRecord[] = [];
        
        sortedProcedures.forEach(proc => {
          if (!uniquePatientIds.has(proc['Patient ID']) && recentPatientProcedures.length < 5) {
            uniquePatientIds.add(proc['Patient ID']);
            recentPatientProcedures.push(proc);
          }
        });
        
        // Map procedures to patients
        const recentPatientsData: RecentPatient[] = recentPatientProcedures.map(proc => {
          const patient = patients.find(p => p['Patient ID'] === proc['Patient ID']);
          // Find the doctor if we have the provider ID
          const doctor = doctors.find(d => d['Provider ID'] === proc['Provider ID']);
          
          return {
            id: proc['Patient ID'],
            name: patient ? `${patient['Patient First Name']} ${patient['Patient Last Name']}` : 'Unknown Patient',
            lastVisit: formatDate(proc['Date of Service']),
            doctor: doctor ? doctor['Provider Name'] : 'Not Assigned',
            status: 'Completed'
          };
        });
        
        setRecentPatients(recentPatientsData);
        
        // For demonstration purposes, create mock upcoming appointments
        // In a real app, this would come from an appointments table
        const mockAppointments: Appointment[] = [
          { 
            id: 'A001', 
            patient: 'Emily Johnson',
            dateTime: '2024-05-20 09:30 AM',
            doctor: 'Dr. Sarah Miller',
            type: 'Check-up'
          },
          { 
            id: 'A002', 
            patient: 'David Williams',
            dateTime: '2024-05-20 11:00 AM',
            doctor: 'Dr. Robert Chen',
            type: 'Follow-up'
          },
          { 
            id: 'A003', 
            patient: 'Michael Brown',
            dateTime: '2024-05-21 10:15 AM',
            doctor: 'Dr. James Wilson',
            type: 'Consultation'
          },
          { 
            id: 'A004', 
            patient: 'Jennifer Garcia',
            dateTime: '2024-05-22 14:00 PM',
            doctor: 'Dr. Sarah Miller',
            type: 'Check-up'
          }
        ];
        
        setUpcomingAppointments(mockAppointments);
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
        setIsLoading(false);
      }
    };
    
    loadData();
  }, []);

  return (
    <div className="bg-gray-50 min-h-screen p-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Practice Dashboard</h1>
        
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-blue-500">Loading dashboard data...</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Recent Patients */}
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6">
                <div>
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Recent Patients
                  </h3>
                  <p className="mt-1 max-w-2xl text-sm text-black">
                    Most recent patient visits at the practice.
                  </p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Patient
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Last Visit
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Doctor
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {recentPatients.map(patient => (
                      <tr key={patient.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                          {patient.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                          {patient.lastVisit}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                          {patient.doctor}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            {patient.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            
            {/* Upcoming Appointments */}
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6">
                <div>
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Upcoming Appointments
                  </h3>
                  <p className="mt-1 max-w-2xl text-sm text-black">
                    Scheduled appointments for the next 7 days.
                  </p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Patient
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date & Time
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Doctor
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {upcomingAppointments.map(appointment => (
                      <tr key={appointment.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                          {appointment.patient}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                          {appointment.dateTime}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                          {appointment.doctor}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                            {appointment.type}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard; 