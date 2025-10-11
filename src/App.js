// App.jsx
import React, { useState } from "react";
import { Analytics } from '@vercel/analytics/react';
import "./App.css";
import { Helmet } from "react-helmet";


function App() {
  const [subjects, setSubjects] = useState([
    { name: "", T: "", A: "", customPercentage: 75 },
  ]);

  const addSubject = () => {
    setSubjects([...subjects, { name: "", T: "", A: "", customPercentage: 75 }]);
  };

  const removeSubject = (index) => {
    if (subjects.length === 1) return;
    const newSubjects = subjects.filter((_, i) => i !== index);
    setSubjects(newSubjects);
  };

  const handleChange = (index, field, value) => {
    const newSubjects = [...subjects];
    
    if (field === 'customPercentage') {
      newSubjects[index][field] = parseFloat(value);
    } else {
      newSubjects[index][field] = value;
    }
    
    setSubjects(newSubjects);
  };

  const calculateAttendance = (T, A, customPercentage) => {
    T = parseInt(T);
    A = parseInt(A);

    if (isNaN(T) || isNaN(A)) return null;

    if (A > T) {
      return { error: "Classes attended cannot be greater than classes held!" };
    }

    const currentPercent = ((A / T) * 100).toFixed(2);
    const requiredDecimal = customPercentage / 100;
    
    // Calculate maximum bunks you can take while maintaining required percentage
    const maxBunks = Math.floor((A / requiredDecimal) - T);
    
    if (maxBunks >= 0) {
      // Safe attendance
      const attendanceAfterMaxBunks = ((A / (T + maxBunks)) * 100).toFixed(2);
      return {
        status: "safe",
        maxBunks,
        currentPercent,
        attendanceAfterMaxBunks,
        T,
        A,
        customPercentage
      };
    } else {
      // Low attendance, calculate additional classes needed
      const classesNeeded = Math.ceil((requiredDecimal * T - A) / (1 - requiredDecimal));
      const attendanceAfterClasses = ((A + classesNeeded) / (T + classesNeeded) * 100).toFixed(2);
      return {
        status: "low",
        classesNeeded,
        currentPercent,
        attendanceAfterClasses,
        T,
        A,
        customPercentage
      };
    }
  };

  const getPercentageColor = (percentage) => {
    if (percentage >= 80) return '#059669';
    if (percentage >= 75) return '#2563eb';
    if (percentage >= 60) return '#d97706';
    return '#dc2626';
  };

  const downloadPDF = async () => {
    const { jsPDF } = await import('jspdf');
    
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPosition = 25;

    // Header with professional styling
    doc.setFillColor(37, 99, 235);
    doc.rect(0, 0, pageWidth, 60, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('Academic Attendance Report', pageWidth / 2, 25, { align: 'center' });
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated on: ${new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })}`, pageWidth / 2, 35, { align: 'center' });
    
    doc.text('Attendance Analytics & Projections', pageWidth / 2, 45, { align: 'center' });
    
    yPosition = 75;

    // Summary section
    doc.setFillColor(249, 250, 251);
    doc.rect(15, yPosition - 10, pageWidth - 30, 20, 'F');
    doc.setTextColor(31, 41, 55);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('ACADEMIC SUMMARY', 20, yPosition);
    
    const totalSubjects = subjects.length;
    const subjectsWithData = subjects.filter(sub => sub.T && sub.A).length;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Total Subjects: ${totalSubjects}`, 20, yPosition + 8);
    doc.text(`Subjects with Data: ${subjectsWithData}`, pageWidth - 20, yPosition + 8, { align: 'right' });
    
    yPosition += 30;

    subjects.forEach((subject, index) => {
      // Check if we need a new page
      if (yPosition > pageHeight - 80) {
        doc.addPage();
        yPosition = 25;
      }

      const result = calculateAttendance(subject.T, subject.A, subject.customPercentage);
      
      // Subject card
      doc.setDrawColor(229, 231, 235);
      doc.setFillColor(255, 255, 255);
      doc.rect(15, yPosition, pageWidth - 30, 70, 'FD');
      
      // Subject header
      doc.setTextColor(31, 41, 55);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(subject.name || `Subject ${index + 1}`, 25, yPosition + 12);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(107, 114, 128);
      doc.text(`Required Attendance: ${subject.customPercentage}%`, 25, yPosition + 22);
      
      if (subject.T && subject.A) {
        // Current stats
        const currentX = pageWidth / 2 - 20;
        doc.setTextColor(75, 85, 99);
        doc.text('Current Statistics:', currentX, yPosition + 12);
        doc.text(`Held: ${subject.T}`, currentX, yPosition + 19);
        doc.text(`Attended: ${subject.A}`, currentX, yPosition + 26);
        doc.text(`Percentage: ${result.currentPercent}%`, currentX, yPosition + 33);
        
        // Status and recommendations
        const statusX = pageWidth - 45;
        if (result.status === "safe") {
          doc.setTextColor(6, 150, 105);
          doc.text('✓ ON TRACK', statusX, yPosition + 12, { align: 'right' });
          doc.setTextColor(75, 85, 99);
          doc.text(`Permitted Absences: ${result.maxBunks} classes`, statusX, yPosition + 22, { align: 'right' });
          doc.text(`Projected: ${result.attendanceAfterMaxBunks}%`, statusX, yPosition + 29, { align: 'right' });
        } else {
          doc.setTextColor(220, 38, 38);
          doc.text(' REQUIRES ACTION', statusX, yPosition + 12, { align: 'right' });
          doc.setTextColor(75, 85, 99);
          doc.text(`Need to attend: ${result.classesNeeded}classes`, statusX, yPosition + 22, { align: 'right' });
          doc.text(`Projected: ${result.attendanceAfterClasses}%`, statusX, yPosition + 29, { align: 'right' });
        }
      } else {
        doc.setTextColor(156, 163, 175);
        doc.text('No attendance data entered', 25, yPosition + 35);
      }
      
      yPosition += 85;
    });

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(156, 163, 175);
    doc.text('Confidential Academic Report - Generated by Attendance Management System', 
             pageWidth / 2, pageHeight - 10, { align: 'center' });

    // Download the PDF
    doc.save(`attendance-report-${new Date().toISOString().split('T')[0]}.pdf`);
  };

 

  return (
    <div className="App">
      <Helmet>
  <title>AttendCalc — Attendance Checker</title>
  <meta name="description" content="Track attendance, Predict Absences, and manage class attendance with ease." />
  
  {/* Open Graph */}
  <meta property="og:type" content="website" />
  <meta property="og:title" content="AttendCalc — Attendance Checker" />
  <meta property="og:description" content="Track attendance, predict absences , and manage class attendance with ease." />
  <meta property="og:url" content="https://attendcalc.vercel.app/" />

  {/* Twitter */}
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="AttendCalc — Attendance Checker" />
  <meta name="twitter:description" content="Track attendance, Predict Absencess, and manage class attendance with ease." />
</Helmet>

      <header className="app-header">
        <div className="header-content">
          <h1>AttendCalc</h1>
          <p>Calculate the permitted absences or required attendance to meet the minimum threshold</p>
        </div>
      </header>

      <div className="report-actions">
        <button onClick={downloadPDF} className="download-btn pdf-btn">
          <span className="btn-icon">📊</span>
          Download PDF Report
        </button>
        {/* <button onClick={downloadTextReport} className="download-btn text-btn">
          <span className="btn-icon">📝</span>
          Export Text Report
        </button> */}
      </div>

      <div className="subjects-container">
        {subjects.map((sub, idx) => {
          const result = calculateAttendance(sub.T, sub.A, sub.customPercentage);
          const isEmpty = !sub.T && !sub.A;
          
          return (
            <div key={idx} className="subject-card">
              <div className="card-header">
                <div className="subject-title">
                  <input
                    type="text"
                    placeholder="Enter subject name"
                    value={sub.name}
                    onChange={(e) => handleChange(idx, "name", e.target.value)}
                    className="subject-name"
                  />
                  <div className="required-percentage-badge">
                    <span style={{ color: getPercentageColor(sub.customPercentage) }}>
                      Target: {sub.customPercentage}%
                    </span>
                  </div>
                </div>
                {subjects.length > 1 && (
                  <button 
                    className="remove-btn"
                    onClick={() => removeSubject(idx)}
                    aria-label="Remove subject"
                  >
                    ×
                  </button>
                )}
              </div>

              <div className="custom-percentage-control">
                <label>Attendance Requirement</label>
                <div className="percentage-input-group">
                  <input
                    type="range"
                    min="50"
                    max="100"
                    step="1"
                    value={sub.customPercentage}
                    onChange={(e) => handleChange(idx, 'customPercentage', e.target.value)}
                    className="percentage-slider"
                  />
                  <span className="percentage-value">{sub.customPercentage}%</span>
                </div>
                <div className="percentage-presets">
                  <button 
                    className={sub.customPercentage === 75 ? 'preset active' : 'preset'}
                    onClick={() => handleChange(idx, 'customPercentage', 75)}
                  >
                    75% Standard
                  </button>
                  <button 
                    className={sub.customPercentage === 80 ? 'preset active' : 'preset'}
                    onClick={() => handleChange(idx, 'customPercentage', 80)}
                  >
                    80% Strict
                  </button>
                  <button 
                    className={sub.customPercentage === 70 ? 'preset active' : 'preset'}
                    onClick={() => handleChange(idx, 'customPercentage', 70)}
                  >
                    70% Lenient
                  </button>
                </div>
              </div>

              <div className="input-group">
                <div className="input-field">
                  <label>Total Classes Held</label>
                  <input
                    type="number"
                    placeholder="Enter total classes"
                    value={sub.T}
                    onChange={(e) => handleChange(idx, "T", e.target.value)}
                    min="0"
                  />
                </div>
                <div className="input-field">
                  <label>Classes Attended</label>
                  <input
                    type="number"
                    placeholder="Enter attended classes"
                    value={sub.A}
                    onChange={(e) => handleChange(idx, "A", e.target.value)}
                    min="0"
                    max={sub.T || undefined}
                  />
                </div>
              </div>

              {!isEmpty && result && (
                <div className={`result ${result.error ? 'error' : result.status}`}>
                  {result.error ? (
                    <div className="error-message">
                      <span className="icon">⚠️</span>
                      <p>{result.error}</p>
                    </div>
                  ) : result.status === "safe" ? (
                    <>
                      <div className="status-indicator safe">
                        <span className="icon">✓</span>
                        <span className="status-text">Attendance On Track</span>
                      </div>
                      <div className="attendance-details">
                        <div className="attendance-row">
                          <span>Current Performance:</span>
                          <span className="attendance-value">
                            {result.A}/{result.T} ({result.currentPercent}%)
                          </span>
                        </div>
                        <div className="attendance-row">
                          <span>Institutional Requirement:</span>
                          <span className="required-value" style={{ color: getPercentageColor(result.customPercentage) }}>
                            {result.customPercentage}%
                          </span>
                        </div>
                        <div className="attendance-row highlight">
                          <span>Available Flexibility:</span>
                          <span className="bunks-remaining">
                            {result.maxBunks} additional absences
                          </span>
                        </div>
                        <div className="attendance-row">
                          <span>Projected Minimum:</span>
                          <span className="attendance-value">
                            {result.attendanceAfterMaxBunks}%
                          </span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="status-indicator low">
                        <span className="icon">⚠️</span>
                        <span className="status-text">Requires Attention</span>
                      </div>
                      <div className="attendance-details">
                        <div className="attendance-row">
                          <span>Current Performance:</span>
                          <span className="attendance-value low">
                            {result.A}/{result.T} ({result.currentPercent}%)
                          </span>
                        </div>
                        <div className="attendance-row">
                          <span>Institutional Requirement:</span>
                          <span className="required-value" style={{ color: getPercentageColor(result.customPercentage) }}>
                            {result.customPercentage}%
                          </span>
                        </div>
                        <div className="attendance-row highlight">
                          <span>Remedial Action Required:</span>
                          <span className="classes-needed">
                            Attend {result.classesNeeded} additional classes
                          </span>
                        </div>
                        <div className="attendance-row">
                          <span>Projected Compliance:</span>
                          <span className="attendance-value">
                            {result.attendanceAfterClasses}%
                          </span>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {isEmpty && (
                <div className="empty-state">
                  <p>Enter class data to generate attendance analytics</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="actions">
        <button onClick={addSubject} className="add-btn">
          <span className="btn-icon">+</span>
          Add Course
        </button>
      </div>

      <footer className="app-footer">
  <p>AttendCalc © {new Date().getFullYear()}</p>
</footer>


      <Analytics />
    </div>
  );
}

export default App;