import { SyntheticEvent, useCallback, useEffect, useRef, useState } from 'react';
import AceEditor from 'react-ace';
import { ChangeData, Diff, Hunk, HunkData } from 'react-diff-view';
import 'react-diff-view/style/index.css';
import CancelIcon from '@mui/icons-material/Cancel';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import SaveIcon from '@mui/icons-material/Save';
import { AppBar, Box, Button, Dialog, Tab, Tabs, Toolbar, Typography } from '@mui/material';
import { useNotifications } from '@toolpad/core/useNotifications';
import 'ace-builds/src-noconflict/ext-language_tools';
import 'ace-builds/src-noconflict/mode-json';
import 'ace-builds/src-noconflict/theme-github';
import 'ace-builds/src-noconflict/theme-github_dark';
import { Change as DiffChangePart, diffLines } from 'diff';
import type { Node, TreeViewHandle } from '@/types/treeView';
import TreeView from '@/components/TreeView';
import { parseTemplateData, removeTypename } from '@/utils/dataManagement';

type DataManagementTabValue = 'tree' | 'preview' | 'diff';

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (dataToSave: Node[]) => Promise<void>;
  templateName: string;
  initialDataString: string | null | undefined;
}

const applyDiffViewThemeStyles = () => {
  const htmlElement = document.documentElement;
  const theme = htmlElement.getAttribute('data-toolpad-color-scheme');

  if (theme === 'dark') {
    htmlElement.style.setProperty('--diff-background-color', 'initial');
    htmlElement.style.setProperty('--diff-text-color', '#f8f8f2');
    htmlElement.style.setProperty('--diff-selection-background-color', '#264f78');
    htmlElement.style.setProperty('--diff-selection-text-color', '#f8f8f2');
    htmlElement.style.setProperty('--diff-gutter-insert-background-color', '#294436');
    htmlElement.style.setProperty('--diff-gutter-insert-text-color', '#c9f7cd');
    htmlElement.style.setProperty('--diff-gutter-delete-background-color', '#4b2b2b');
    htmlElement.style.setProperty('--diff-gutter-delete-text-color', '#ffc9c9');
    htmlElement.style.setProperty('--diff-gutter-selected-background-color', '#4a4a00');
    htmlElement.style.setProperty('--diff-gutter-selected-text-color', '#f8f8f2');
    htmlElement.style.setProperty('--diff-code-insert-background-color', '#1f3d2e');
    htmlElement.style.setProperty('--diff-code-insert-text-color', '#c9f7cd');
    htmlElement.style.setProperty('--diff-code-delete-background-color', '#4b2b2b');
    htmlElement.style.setProperty('--diff-code-delete-text-color', '#ffc9c9');
    htmlElement.style.setProperty('--diff-code-insert-edit-background-color', '#3c5731');
    htmlElement.style.setProperty('--diff-code-insert-edit-text-color', '#e2ffcc');
    htmlElement.style.setProperty('--diff-code-delete-edit-background-color', '#70373c');
    htmlElement.style.setProperty('--diff-code-delete-edit-text-color', '#ffd9dc');
    htmlElement.style.setProperty('--diff-code-selected-background-color', '#4a4a00');
    htmlElement.style.setProperty('--diff-code-selected-text-color', '#f8f8f2');
    htmlElement.style.setProperty('--diff-omit-gutter-line-color', '#ff7b72');
  } else {
    htmlElement.style.setProperty('--diff-background-color', 'initial');
    htmlElement.style.setProperty('--diff-text-color', 'initial');
    htmlElement.style.setProperty('--diff-selection-background-color', '#b3d7ff');
    htmlElement.style.setProperty('--diff-selection-text-color', '#000');
    htmlElement.style.setProperty('--diff-gutter-insert-background-color', '#d6fedb');
    htmlElement.style.setProperty('--diff-gutter-insert-text-color', '#000');
    htmlElement.style.setProperty('--diff-gutter-delete-background-color', '#fadde0');
    htmlElement.style.setProperty('--diff-gutter-delete-text-color', '#000');
    htmlElement.style.setProperty('--diff-gutter-selected-background-color', '#fffce0');
    htmlElement.style.setProperty('--diff-gutter-selected-text-color', '#000');
    htmlElement.style.setProperty('--diff-code-insert-background-color', '#eaffee');
    htmlElement.style.setProperty('--diff-code-insert-text-color', '#000');
    htmlElement.style.setProperty('--diff-code-delete-background-color', '#fdeff0');
    htmlElement.style.setProperty('--diff-code-delete-text-color', '#000');
    htmlElement.style.setProperty('--diff-code-insert-edit-background-color', '#c0dc91');
    htmlElement.style.setProperty('--diff-code-insert-edit-text-color', '#000');
    htmlElement.style.setProperty('--diff-code-delete-edit-background-color', '#f39ea2');
    htmlElement.style.setProperty('--diff-code-delete-edit-text-color', '#000');
    htmlElement.style.setProperty('--diff-code-selected-background-color', '#fffce0');
    htmlElement.style.setProperty('--diff-code-selected-text-color', '#000');
    htmlElement.style.setProperty('--diff-omit-gutter-line-color', '#cb2a1d');
  }
};

export function DataManagement({ open, onClose, onSave, templateName, initialDataString }: Props) {
  const [dataManagementTabValue, setDataManagementTabValue] = useState<DataManagementTabValue>('tree');
  const [originalTreeData, setOriginalTreeData] = useState<Node[]>([]);
  const [treeData, setTreeData] = useState<Node[]>([]);
  const [hasErrors, setHasErrors] = useState(false);
  const [diffHunk, setDiffHunk] = useState<HunkData | null>(null);
  const [hasDifferences, setHasDifferences] = useState(false);
  const [theme, setTheme] = useState<'github' | 'github_dark'>('github');

  const treeViewRef = useRef<TreeViewHandle>(null);
  const notifications = useNotifications();

  const handleClickImport = useCallback(() => {
    const fileInput = document.createElement('input');

    fileInput.type = 'file';
    fileInput.accept = 'application/json';

    fileInput.onchange = (event) => {
      const target = event.target as HTMLInputElement;

      if (!target.files?.length) return;

      const file = target.files[0];

      if (!file) {
        notifications.show('파일을 선택하지 않았습니다.', { severity: 'error', autoHideDuration: 2000 });

        return;
      }

      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const jsonData = JSON.parse(content);
          const importedData = parseTemplateData(JSON.stringify(jsonData));

          setTreeData(importedData);

          if (treeViewRef.current && importedData.length > 0) {
            setDataManagementTabValue('preview');
          }

          notifications.show('데이터를 성공적으로 가져왔습니다.', { severity: 'success', autoHideDuration: 2000 });
        } catch (error) {
          console.error('JSON 파일 처리 중 오류 발생:', error);

          notifications.show('유효하지 않은 JSON 형식입니다. 다시 확인해주세요.', { severity: 'error', autoHideDuration: 3000 });
        }
      };

      reader.onerror = () => {
        notifications.show('파일 읽기에 실패했습니다.', { severity: 'error', autoHideDuration: 2000 });
      };

      reader.readAsText(file);
    };

    fileInput.click();
  }, [notifications]);

  const handleClickExport = useCallback(() => {
    try {
      let dataToExport = treeData;

      if (treeViewRef.current) {
        dataToExport = treeViewRef.current.flushChanges();
      }

      const exportData = JSON.stringify(removeTypename(dataToExport), null, 2);
      const blob = new Blob([exportData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');

      link.href = url;
      link.download = `${templateName}.json`;

      document.body.appendChild(link);

      link.click();

      setTimeout(() => {
        document.body.removeChild(link);

        URL.revokeObjectURL(url);
      }, 100);

      notifications.show('데이터를 성공적으로 내보냈습니다.', { severity: 'success', autoHideDuration: 2000 });
    } catch (error) {
      console.error('JSON 내보내기 중 오류 발생:', error);

      notifications.show('데이터 내보내기에 실패했습니다.', { severity: 'error', autoHideDuration: 2000 });
    }
  }, [treeData, templateName, notifications]);

  const handleClickSave = useCallback(async () => {
    if (hasErrors) {
      notifications.show('데이터에 오류가 있어 저장할 수 없습니다. 수정 후 다시 시도해주세요.', { severity: 'warning', autoHideDuration: 3000 });

      return;
    }

    let dataToSave = treeData;

    if (treeViewRef.current) {
      dataToSave = treeViewRef.current.flushChanges();
    }

    try {
      await onSave(dataToSave);
    } catch (error) {
      console.error('데이터 저장 중 오류 발생 (부모 onSave 콜백에서 예외 발생):', error);
    }
  }, [hasErrors, treeData, onSave, notifications]);

  const handleChangeTab = useCallback(
    (_event: SyntheticEvent, newValue: DataManagementTabValue) => {
      if (newValue === 'diff') {
        applyDiffViewThemeStyles();

        try {
          let currentTreeViewData = treeData;

          if (treeViewRef.current) {
            currentTreeViewData = treeViewRef.current.flushChanges();
          }

          const originalDataStringified = JSON.stringify(removeTypename(originalTreeData), null, 2);
          const currentDataStringified = JSON.stringify(removeTypename(currentTreeViewData), null, 2);
          const differences: DiffChangePart[] = diffLines(originalDataStringified, currentDataStringified);
          const processedChanges: ChangeData[] = [];

          let oldLineNum = 1;
          let newLineNum = 1;

          differences.forEach((part) => {
            const lines = part.value.split('\n');

            if (lines.length > 0 && lines[lines.length - 1] === '') {
              lines.pop();
            }

            lines.forEach((lineContent) => {
              if (part.added) {
                processedChanges.push({ type: 'insert', isInsert: true, lineNumber: newLineNum++, content: lineContent });
              } else if (part.removed) {
                processedChanges.push({ type: 'delete', isDelete: true, lineNumber: oldLineNum++, content: lineContent });
              } else {
                processedChanges.push({ type: 'normal', isNormal: true, oldLineNumber: oldLineNum++, newLineNumber: newLineNum++, content: lineContent });
              }
            });
          });

          setHasDifferences(processedChanges.some((change) => change.type === 'insert' || change.type === 'delete'));

          if (processedChanges.length > 0) {
            const oldLinesInHunk = processedChanges.filter((c) => c.type === 'normal' || c.type === 'delete').length;
            const newLinesInHunk = processedChanges.filter((c) => c.type === 'normal' || c.type === 'insert').length;

            setDiffHunk({ content: `@@ -1,${oldLinesInHunk} +1,${newLinesInHunk} @@`, oldStart: 1, newStart: 1, oldLines: oldLinesInHunk, newLines: newLinesInHunk, changes: processedChanges });
          } else {
            setDiffHunk(null);
          }
        } catch (error) {
          console.error('Diff 데이터 생성에 실패했습니다:', error);

          notifications.show(error instanceof Error ? `변경 내역 생성 실패: ${error.message}` : '변경 내역을 생성하는 중 오류가 발생했습니다.', { severity: 'error', autoHideDuration: 2000 });
        }
      }

      setDataManagementTabValue(newValue);
    },
    [treeData, originalTreeData, notifications],
  );

  const handleDataChange = (newData: Node[]) => setTreeData(newData);

  const handleErrorsChange = (errorsExist: boolean) => {
    setHasErrors(errorsExist);

    if (errorsExist && dataManagementTabValue === 'diff') setDataManagementTabValue('tree');
  };

  useEffect(() => {
    const { documentElement } = document;
    const currentScheme = documentElement.getAttribute('data-toolpad-color-scheme');

    setTheme(currentScheme === 'dark' ? 'github_dark' : 'github');

    const observer = new MutationObserver((mutationsList) => {
      for (const mutation of mutationsList) {
        if (mutation.type === 'attributes' && mutation.attributeName === 'data-toolpad-color-scheme') {
          setTheme(documentElement.getAttribute('data-toolpad-color-scheme') === 'dark' ? 'github_dark' : 'github');
        }
      }
    });

    observer.observe(documentElement, { attributes: true, attributeFilter: ['data-toolpad-color-scheme'] });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (open) {
      const parsedInitialData = parseTemplateData(initialDataString);

      setOriginalTreeData(parsedInitialData);
      setTreeData(parsedInitialData);
      setDataManagementTabValue('tree');
      setDiffHunk(null);
      setHasDifferences(false);
      setHasErrors(false);
    }
  }, [open, initialDataString]);

  return (
    <Dialog container={document.getElementById('layers')} fullScreen open={open} onClose={onClose}>
      <AppBar sx={{ position: 'relative', boxShadow: 'none', borderBottom: 'solid 1px var(--mui-palette-divider)', backgroundColor: 'var(--mui-palette-background-default)' }}>
        <Toolbar sx={{ gap: '10px' }}>
          <Typography sx={{ flex: 1, color: 'var(--mui-palette-primary-main)' }} variant="h6" component="div">
            [{templateName}] 데이터 관리
          </Typography>
          <Button variant="outlined" color="secondary" disableElevation startIcon={<FileDownloadIcon />} disabled={hasErrors} onClick={handleClickImport}>
            Import
          </Button>
          <Button variant="outlined" color="secondary" disableElevation startIcon={<FileUploadIcon />} disabled={hasErrors} onClick={handleClickExport}>
            Export
          </Button>
          <Button variant="outlined" disableElevation startIcon={<CancelIcon />} onClick={onClose}>
            취소
          </Button>
          <Button variant="contained" disableElevation startIcon={<SaveIcon />} disabled={hasErrors} onClick={handleClickSave}>
            저장
          </Button>
        </Toolbar>
      </AppBar>
      <Box sx={{ display: 'flex', flexDirection: 'column', height: 'calc(100% - 65px)' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={dataManagementTabValue} onChange={handleChangeTab}>
            <Tab label="트리 편집" value="tree" />
            <Tab label="트리 보기" value="preview" disabled={hasErrors} />
            <Tab label="변경 내역" value="diff" disabled={hasErrors} />
          </Tabs>
        </Box>
        {dataManagementTabValue === 'tree' && (
          <Box sx={{ overflow: { xs: 'auto', lg: 'hidden' }, display: 'flex', flexGrow: 1, flexDirection: { xs: 'column', lg: 'row' }, height: '100%' }}>
            <TreeView ref={treeViewRef} data={treeData} onDataChange={handleDataChange} onErrorsChange={handleErrorsChange} />
          </Box>
        )}
        {dataManagementTabValue === 'preview' && (
          <Box sx={{ flexGrow: 1, overflow: 'auto', height: '100%' }}>
            <AceEditor
              mode="json"
              theme={theme}
              name="template_preview_editor"
              width="100%"
              height="100%"
              value={JSON.stringify(removeTypename(treeData), null, 2)}
              readOnly
              fontSize={12}
              showPrintMargin
              showGutter
              highlightActiveLine
              setOptions={{
                enableBasicAutocompletion: false,
                enableLiveAutocompletion: false,
                enableSnippets: false,
                showLineNumbers: true,
                tabSize: 2,
                useWorker: false,
              }}
              style={{ backgroundColor: theme === 'github' ? '#fff' : '#222' }}
            />
          </Box>
        )}
        {dataManagementTabValue === 'diff' && !hasErrors && (
          <Box sx={{ overflow: 'auto', fontSize: '13px', height: '100%', backgroundColor: theme === 'github' ? '#fff' : '#222' }}>
            {hasDifferences && diffHunk ? (
              <Diff viewType="split" diffType="modify" hunks={[diffHunk]} gutterType="anchor">
                {(hunks: HunkData[]) => hunks.map((hunk) => <Hunk key={`${hunk.oldStart}-${hunk.newStart}-${hunk.content.substring(0, 20)}`} hunk={hunk} />)}
              </Diff>
            ) : (
              <Typography variant="body1" sx={{ textAlign: 'center', marginTop: '50px' }}>
                변경 사항이 없습니다.
              </Typography>
            )}
          </Box>
        )}
      </Box>
    </Dialog>
  );
}
