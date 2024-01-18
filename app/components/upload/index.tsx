"use client"

import React, { useState } from "react";
import { useDropzone } from 'react-dropzone'

import styles from './styles.module.css'

type ErrorReports = {
  [filename: string]: string[];
};

const UploadDropzone = () => {
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const [errorFiles, setErrorFiles] = useState<ErrorReports>({});

  const { acceptedFiles, fileRejections, getRootProps, getInputProps } = useDropzone({
    accept: {
      'text/plain': ['.json'],
      'application/json': ['.json'],
    },
    onDropAccepted: files => {
      // define errors as array of string
      files.forEach(async file => {
        try {
          // Upload file to server using upload API
          let formData = new FormData();
          formData.append("configfile", file);

          const res = await fetch("/api/config", {
            method: "POST",
            body: formData,
          });

          // parse message
          const data = await res.json();

          if (!data || (!data.success && !data.error)) {
            // Server error (unknown)
            setErrorFiles((prevErrorFiles) => ({
              ...prevErrorFiles,
              [file.name]: ['Could not process files (server error).']
            }));
          } else if (data.success) {
            // Success: add to list of successfully uploaded files
            setUploadedFiles(uploadedFiles => [...uploadedFiles, file.name]);
            // Remove entry from errorFiles if one exists for file.name
            const newErrorState = { ...errorFiles };
            if (newErrorState.hasOwnProperty(file.name)) {
              // Remove the entry with the specified filename
              delete newErrorState[file.name];
              setErrorFiles(newErrorState);
            }

          } else {
            // Error parsing file content: add erroneous file to list
            let errors: string[] = [];
            errors.push(data.error);
            // Add error messages from full report
            if (data.report) {
              for (const i in data.report) {
                errors.push(data.report[i])
              }
            }
            // report error files
            setErrorFiles((prevErrorFiles) => ({
              ...prevErrorFiles,
              [file.name]: errors
            }));
          }
        } catch (error) {
          // Error uploading file: add erroneous file to list
          setErrorFiles((prevErrorFiles) => ({
            ...prevErrorFiles,
            [file.name]: ['Could not process files (client error).']
          }));
        }
      });
    }
  });

  return (
    <section>
      <div {...getRootProps({ className: `d-flex justify-content-center align-items-center ${styles.dropzone}` })}>
        <input {...getInputProps()} />
        <div>Drag &apos;n&apos; drop some files here, or click to select files</div>
      </div>
      {acceptedFiles.length > 0 || fileRejections.length > 0 ? (
        <div id={styles.acceptedfiles} className="mt-4">
          <h4>Upload status</h4>
          <ul className={styles.filelist}>
            {acceptedFiles.map(file => (
              <li key={file.name}
                className={`${uploadedFiles.indexOf(file.name) !== -1 ? styles.uploaded : errorFiles[file.name] ? styles.erroneous : styles.uploading}`}>
                <div>
                  {file.name}
                  {
                    errorFiles[file.name] ? (
                      errorFiles[file.name].map((error, idx) => (
                        <div key={idx} className="small">{idx ? '- ' : ''}{error}</div>
                      ))
                    ) : null
                  }
                </div>
              </li>
            ))}
            {fileRejections.map(item => (
              <li key={item.file.name} className={`${styles.erroneous}`}>
                {item.file.name} <small>- Wrong type of file</small>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        null
      )}
      <div className="mt-3">
        <a
          href="/"
          className={`btn ${acceptedFiles.length > 0 ? 'btn-primary' : 'btn-secondary'}`}
        >Back to home page</a>
      </div>
    </section >
  )

}

export default UploadDropzone;