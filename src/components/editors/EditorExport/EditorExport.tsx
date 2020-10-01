import React, { FC, useContext, useEffect, useRef, useState } from 'react';
import useStyles from './EditorExport.styles';
import JSONEditor, { JSONEditorMode } from 'jsoneditor';
import { exportForm } from '@utils/index';
import { FormStructureContext } from '@contexts/FormStructureContext';
import { CustomisedOutlineButton } from '@styles/CustomisedOutlineButton';
import { CustomisedButton } from '@styles/CustomisedButton';
import 'jsoneditor/dist/jsoneditor.css';

interface EditorExportProps {
  resetEditor: () => void;
}

const EditorExport: FC<EditorExportProps> = ({ resetEditor }) => {
  const classes = useStyles();

  const jsonEditorContainer = useRef<any>(null);
  const [jsonEditorInstance, setJsonEditorInstance] = useState<JSONEditor | null>(null);

  const { formContext, getClonedFormStructure } = useContext(FormStructureContext);
  const [form, setForm] = useState<any>(null);

  useEffect(() => {
    async function getExportedForm() {
      const formStructure = getClonedFormStructure();

      const exportedForm = await exportForm(formStructure, formContext);

      setForm(exportedForm);
    }

    getExportedForm();
  }, []);

  useEffect(() => {
    const options = {
      mode: 'code' as JSONEditorMode,
      onEditable: () => false
    };

    if (!jsonEditorContainer.current.firstChild) {
      const jsonEditor = new JSONEditor(jsonEditorContainer.current, options);

      setJsonEditorInstance(jsonEditor);
    }

    jsonEditorInstance?.set(form);
  }, [form]);

  const downloadExportedForm = () => {
    const element = document.createElement('a');
    element.setAttribute('href', 'data:application/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(form)));
    element.setAttribute('download', 'form');

    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(JSON.stringify(form));
  };

  return (
    <>
      <div className={classes.getExportedFormButtons}>
        <CustomisedOutlineButton
          variant="outlined"
          size="large"
          onClick={downloadExportedForm}
          className={classes.buttonWidth}
        >
          Download
        </CustomisedOutlineButton>
        <span>or</span>
        <CustomisedOutlineButton
          variant="outlined"
          size="large"
          onClick={copyToClipboard}
          className={classes.buttonWidth}
        >
          Copy to clipboard
        </CustomisedOutlineButton>
        <span>or</span>
        <span className={classes.italic}>Copy your JSON-LD from form below</span>
      </div>
      <div className={classes.container} ref={jsonEditorContainer} />
      <div className={classes.buildNewFormButtonContainer}>
        <CustomisedButton variant="contained" size="large" onClick={resetEditor} className={classes.buttonWidth}>
          Build a new form
        </CustomisedButton>
      </div>
    </>
  );
};

export default EditorExport;
