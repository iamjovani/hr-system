"use client";

import { useState } from 'react';
import { 
  Card, 
  CardContent 
} from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  MoreVertical, 
  Calendar, 
  Clock, 
  AlertCircle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Info
} from "lucide-react";
import { Clock as ClockComponent } from '@/components/ui/clock';

export default function TimeOffPage() {
  const userName = "wildan";
  
  // This would come from your backend in a real application
  const [timeOffSummary, setTimeOffSummary] = useState({
    daysAvailable: 3,
    pendingRequests: 0,
    daysUpcoming: 0,
    daysPerYear: 0
  });
  
  const [requestedTimeOff, setRequestedTimeOff] = useState([
    {
      id: 1,
      selected: true,
      leaveType: "Time off",
      duration: 36,
      dateFrom: "24/10/2023",
      dateTo: "24/10/2023",
      notes: "I am feeling unwell and unable to come to work...",
      addedOn: "24/10/2023",
      status: "pending"
    },
    {
      id: 2,
      selected: false,
      leaveType: "Sick",
      duration: 24,
      dateFrom: "24/10/2023",
      dateTo: "24/10/2023",
      notes: "I have a medical appointment scheduled",
      addedOn: "24/10/2023",
      status: "pending"
    },
    {
      id: 3,
      selected: false,
      leaveType: "Family Emergency",
      duration: 24,
      dateFrom: "24/10/2023",
      dateTo: "24/10/2023",
      notes: "I am dealing with a family emergency and need...",
      addedOn: "24/10/2023",
      status: "pending"
    }
  ]);
  
  const [timeOffHistory, setTimeOffHistory] = useState([
    {
      id: 1,
      leaveType: "Time off",
      duration: 36,
      dateFrom: "24/10/2023",
      dateTo: "24/10/2023",
      notes: "Goin on vacation, taking a half day on...",
      addedOn: "24/10/2023",
      status: "accepted"
    },
    {
      id: 2,
      leaveType: "Sick",
      duration: 36,
      dateFrom: "24/10/2023",
      dateTo: "24/10/2023",
      notes: "Goin on vacation, taking a half day on...",
      addedOn: "24/10/2023",
      status: "requested"
    },
    {
      id: 3,
      leaveType: "Sick",
      duration: 36,
      dateFrom: "24/10/2023",
      dateTo: "24/10/2023",
      notes: "Goin on vacation, taking a half day on...",
      addedOn: "24/10/2023",
      status: "accepted"
    },
    {
      id: 4,
      leaveType: "Sick",
      duration: 36,
      dateFrom: "24/10/2023",
      dateTo: "24/10/2023",
      notes: "Goin on vacation, taking a half day on...",
      addedOn: "24/10/2023",
      status: "declined"
    }
  ]);
  
  type TimeOffStatus = 'accepted' | 'requested' | 'declined' | 'pending';

  const getStatusBadge = (status: TimeOffStatus) => {
    switch(status) {
      case 'accepted':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100 flex items-center gap-1">
          <CheckCircle2 className="h-3.5 w-3.5" /> Accepted
        </Badge>;
      case 'requested':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100 flex items-center gap-1">
          <HelpCircle className="h-3.5 w-3.5" /> Requested
        </Badge>;
      case 'declined':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100 flex items-center gap-1">
          <XCircle className="h-3.5 w-3.5" /> Declined
        </Badge>;
      case 'pending':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 flex items-center gap-1">
          <Clock className="h-3.5 w-3.5" /> Pending
        </Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };
  
  return (
    <div className="min-h-screen bg-background p-6">
      {/* Clock in the top right */}
      <div className="absolute top-4 right-4 z-10">
        <ClockComponent />
      </div>
      
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm text-muted-foreground">Time Off /</p>
            <h1 className="text-2xl font-bold">About {userName}'s time off</h1>
          </div>
          <Button variant="ghost" size="icon">
            <MoreVertical className="h-5 w-5" />
          </Button>
        </div>
        
        {/* Time Off Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="relative border-primary/20">
            <div className="absolute top-2 right-2 text-primary">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <CardContent className="pt-6">
              <div className="flex flex-col gap-2">
                <span className="text-3xl font-bold">{timeOffSummary.daysAvailable}</span>
                <div>
                  <p className="font-medium">Days available</p>
                  <p className="text-sm text-muted-foreground">to book time off</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <div className="absolute top-2 right-2 text-muted-foreground">
              <AlertCircle className="h-5 w-5" />
            </div>
            <CardContent className="pt-6">
              <div className="flex flex-col gap-2">
                <span className="text-3xl font-bold">{timeOffSummary.pendingRequests}</span>
                <div>
                  <p className="font-medium">Pending requests</p>
                  <p className="text-sm text-muted-foreground">awaiting manager approval</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <div className="absolute top-2 right-2 text-muted-foreground">
              <Calendar className="h-5 w-5" />
            </div>
            <CardContent className="pt-6">
              <div className="flex flex-col gap-2">
                <span className="text-3xl font-bold">{timeOffSummary.daysUpcoming}</span>
                <div>
                  <p className="font-medium">Days upcoming</p>
                  <p className="text-sm text-muted-foreground">{timeOffSummary.daysUpcoming} days taken</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <div className="absolute top-2 right-2 text-muted-foreground">
              <Calendar className="h-5 w-5" />
            </div>
            <CardContent className="pt-6">
              <div className="flex flex-col gap-2">
                <span className="text-3xl font-bold">{timeOffSummary.daysPerYear}</span>
                <div>
                  <p className="font-medium">Days per year</p>
                  <p className="text-sm text-muted-foreground">in the contract</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Requested Time Off Section */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold">Requested time off</h2>
            <div className="flex items-center gap-1">
              <span>{requestedTimeOff.length}</span>
              <span className="text-muted-foreground">record</span>
              <Info className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>
          
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox />
                  </TableHead>
                  <TableHead>Leave Type</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Date from</TableHead>
                  <TableHead>Date to</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead>Added on</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requestedTimeOff.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell>
                      <Checkbox checked={request.selected} />
                    </TableCell>
                    <TableCell className="font-medium">{request.leaveType}</TableCell>
                    <TableCell>{request.duration} hours</TableCell>
                    <TableCell>{request.dateFrom}</TableCell>
                    <TableCell>{request.dateTo}</TableCell>
                    <TableCell className="max-w-xs truncate">{request.notes}</TableCell>
                    <TableCell>{request.addedOn}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-green-600">
                          <CheckCircle2 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600">
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
        
        {/* Time Off Summary Section */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold">Time off summary</h2>
            <div className="flex items-center gap-1">
              <span>{timeOffHistory.length}</span>
              <span className="text-muted-foreground">record</span>
              <Info className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>
          
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Leave Type</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Date from</TableHead>
                  <TableHead>Date to</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead>Added on</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-8"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {timeOffHistory.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.leaveType}</TableCell>
                    <TableCell>{item.duration} hours</TableCell>
                    <TableCell>{item.dateFrom}</TableCell>
                    <TableCell>{item.dateTo}</TableCell>
                    <TableCell className="max-w-xs truncate">{item.notes}</TableCell>
                    <TableCell>{item.addedOn}</TableCell>
                    
                    <TableCell>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
}