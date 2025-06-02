
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, Download, Clock, CheckCircle2, Bell, Filter } from 'lucide-react';
import { useExam } from '../../contexts/ExamContext';
import { toast } from '@/hooks/use-toast';

interface StudentSubmission {
  id: string;
  studentName: string;
  studentClass: string;
  examId: string;
  examTitle: string;
  subject: string;
  score: number;
  totalQuestions: number;
  submissionTime: string;
  timeSpent: string;
  isNew: boolean;
}

export const StudentResults = () => {
  const { exams } = useExam();
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'new' | 'reviewed'>('all');

  // Mock student submissions data with real exam references
  const [studentSubmissions] = useState<StudentSubmission[]>([
    {
      id: '1',
      studentName: 'John Doe',
      studentClass: 'SS1A',
      examId: exams[0]?.id || '1',
      examTitle: exams[0]?.title || 'Mathematics Mid-Term',
      subject: exams[0]?.subject || 'Mathematics',
      score: 17,
      totalQuestions: 20,
      submissionTime: '2024-06-02 14:30:00',
      timeSpent: '45 minutes',
      isNew: true
    },
    {
      id: '2',
      studentName: 'Jane Smith',
      studentClass: 'SS1A',
      examId: exams[0]?.id || '1',
      examTitle: exams[0]?.title || 'Mathematics Mid-Term',
      subject: exams[0]?.subject || 'Mathematics',
      score: 16,
      totalQuestions: 20,
      submissionTime: '2024-06-02 14:15:00',
      timeSpent: '42 minutes',
      isNew: true
    },
    {
      id: '3',
      studentName: 'Bob Johnson',
      studentClass: 'SS1B',
      examId: exams[1]?.id || '2',
      examTitle: exams[1]?.title || 'Physics Quiz',
      subject: exams[1]?.subject || 'Physics',
      score: 18,
      totalQuestions: 20,
      submissionTime: '2024-06-01 16:20:00',
      timeSpent: '38 minutes',
      isNew: false
    }
  ]);

  const newSubmissions = studentSubmissions.filter(sub => sub.isNew);
  const filteredSubmissions = studentSubmissions.filter(submission => {
    if (selectedFilter === 'new') return submission.isNew;
    if (selectedFilter === 'reviewed') return !submission.isNew;
    return true;
  });

  const handleViewResult = (submissionId: string) => {
    toast({
      title: "Viewing Result",
      description: "Opening detailed exam result view...",
    });
  };

  const handleDownloadResult = (submission: StudentSubmission) => {
    // Create mock CSV data
    const csvData = [
      ['Student Name', 'Class', 'Exam', 'Subject', 'Score', 'Total Questions', 'Percentage', 'Submission Time', 'Time Spent'],
      [
        submission.studentName,
        submission.studentClass,
        submission.examTitle,
        submission.subject,
        submission.score.toString(),
        submission.totalQuestions.toString(),
        `${Math.round((submission.score / submission.totalQuestions) * 100)}%`,
        submission.submissionTime,
        submission.timeSpent
      ]
    ];

    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${submission.studentName}_${submission.examTitle}_Result.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }

    toast({
      title: "Download Started",
      description: `Downloading result for ${submission.studentName}`,
    });
  };

  const handleDownloadAllResults = () => {
    const csvData = [
      ['Student Name', 'Class', 'Exam', 'Subject', 'Score', 'Total Questions', 'Percentage', 'Submission Time', 'Time Spent']
    ];

    filteredSubmissions.forEach(submission => {
      csvData.push([
        submission.studentName,
        submission.studentClass,
        submission.examTitle,
        submission.subject,
        submission.score.toString(),
        submission.totalQuestions.toString(),
        `${Math.round((submission.score / submission.totalQuestions) * 100)}%`,
        submission.submissionTime,
        submission.timeSpent
      ]);
    });

    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `All_Exam_Results_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }

    toast({
      title: "Download Started",
      description: "Downloading all exam results",
    });
  };

  const getScoreBadge = (score: number, total: number) => {
    const percentage = (score / total) * 100;
    if (percentage >= 80) return <Badge className="bg-green-100 text-green-800">Excellent</Badge>;
    if (percentage >= 70) return <Badge className="bg-blue-100 text-blue-800">Good</Badge>;
    if (percentage >= 60) return <Badge className="bg-yellow-100 text-yellow-800">Average</Badge>;
    return <Badge className="bg-red-100 text-red-800">Needs Improvement</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Notifications Alert */}
      {newSubmissions.length > 0 && (
        <Alert className="border-blue-200 bg-blue-50">
          <Bell className="h-4 w-4" />
          <AlertDescription>
            You have {newSubmissions.length} new exam submission{newSubmissions.length > 1 ? 's' : ''} to review!
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <span>Student Exam Results</span>
                {newSubmissions.length > 0 && (
                  <Badge variant="destructive">{newSubmissions.length} New</Badge>
                )}
              </CardTitle>
              <CardDescription>
                View and manage student examination results and submissions
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1">
                <Filter className="h-4 w-4" />
                <Button
                  variant={selectedFilter === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedFilter('all')}
                >
                  All ({studentSubmissions.length})
                </Button>
                <Button
                  variant={selectedFilter === 'new' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedFilter('new')}
                >
                  New ({newSubmissions.length})
                </Button>
                <Button
                  variant={selectedFilter === 'reviewed' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedFilter('reviewed')}
                >
                  Reviewed ({studentSubmissions.filter(s => !s.isNew).length})
                </Button>
              </div>
              <Button onClick={handleDownloadAllResults} className="bg-green-600 hover:bg-green-700">
                <Download className="h-4 w-4 mr-2" />
                Download All
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Exam</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Performance</TableHead>
                <TableHead>Submission Time</TableHead>
                <TableHead>Time Spent</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSubmissions.map((submission) => (
                <TableRow key={submission.id} className={submission.isNew ? 'bg-blue-50' : ''}>
                  <TableCell className="font-medium">{submission.studentName}</TableCell>
                  <TableCell>{submission.studentClass}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{submission.examTitle}</p>
                      <p className="text-sm text-gray-600">{submission.subject}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-center">
                      <p className="text-lg font-bold">{submission.score}/{submission.totalQuestions}</p>
                      <p className="text-sm text-gray-600">
                        {Math.round((submission.score / submission.totalQuestions) * 100)}%
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>{getScoreBadge(submission.score, submission.totalQuestions)}</TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <p>{new Date(submission.submissionTime).toLocaleDateString()}</p>
                      <p className="text-gray-600">{new Date(submission.submissionTime).toLocaleTimeString()}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center text-sm">
                      <Clock className="h-4 w-4 mr-1" />
                      {submission.timeSpent}
                    </div>
                  </TableCell>
                  <TableCell>
                    {submission.isNew ? (
                      <Badge variant="destructive">
                        <Bell className="h-3 w-3 mr-1" />
                        New
                      </Badge>
                    ) : (
                      <Badge variant="outline">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Reviewed
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleViewResult(submission.id)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDownloadResult(submission)}
                        className="bg-green-50 hover:bg-green-100"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredSubmissions.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No exam submissions found for the selected filter.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
