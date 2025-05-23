import { ElementType, HTMLAttributes, ReactNode, Ref, memo } from 'react';
import FileCopyIcon from '@mui/icons-material/FileCopy';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import { Box } from '@mui/material';
import Collapse from '@mui/material/Collapse';
import { styled } from '@mui/material/styles';
import { alpha } from '@mui/material/styles';
import { TreeItem2Checkbox, TreeItem2Content, TreeItem2IconContainer, TreeItem2Label } from '@mui/x-tree-view/TreeItem2';
import { TreeItem2DragAndDropOverlay } from '@mui/x-tree-view/TreeItem2DragAndDropOverlay';
import { TreeItem2Icon } from '@mui/x-tree-view/TreeItem2Icon';
import { TreeItem2Provider } from '@mui/x-tree-view/TreeItem2Provider';
import { UseTreeItem2Parameters, useTreeItem2 } from '@mui/x-tree-view/useTreeItem2';
import clsx from 'clsx';
import { isExpandable } from '@/utils/treeView';

interface NodeProps extends Omit<UseTreeItem2Parameters, 'rootRef'>, Omit<HTMLAttributes<HTMLLIElement>, 'onFocus'> {
  ref?: Ref<HTMLLIElement>;
}

interface LabelProps {
  children: ReactNode;
  icon?: ElementType;
  expandable?: 'true' | 'false';
}

const Content = styled(TreeItem2Content)(({ theme }) => ({
  flexDirection: 'row-reverse',
  margin: '3px 0',
  padding: '5px',
  '&:hover': {
    backgroundColor: alpha(theme.palette.primary.main, 0.1),
    color: 'white',
    ...theme.applyStyles('light', { color: theme.palette.primary.main }),
  },
  [`&.Mui-focused, &.Mui-selected, &.Mui-selected.Mui-focused`]: {
    backgroundColor: theme.palette.primary.dark,
    color: theme.palette.primary.contrastText,
    ...theme.applyStyles('light', { backgroundColor: theme.palette.primary.main }),
  },
}));

const Label = ({ icon: Icon, children, ...other }: LabelProps) => {
  return (
    <TreeItem2Label {...other} sx={{ display: 'flex', alignItems: 'center' }}>
      {Icon && <Box component={Icon} className="labelIcon" color="inherit" sx={{ margin: '0 5px', fontSize: '20px' }} />}
      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{children}</div>
    </TreeItem2Label>
  );
};

export default memo(function Node({ id, itemId, label, disabled, children, ref }: NodeProps) {
  const expandable = isExpandable(children);
  const icon = expandable ? FileCopyIcon : InsertDriveFileIcon;

  const { getContentProps, getIconContainerProps, getCheckboxProps, getLabelProps, getGroupTransitionProps, getDragAndDropOverlayProps, status } = useTreeItem2({ id, itemId, children, label, disabled, rootRef: ref });

  return (
    <TreeItem2Provider itemId={itemId}>
      <Content
        {...getContentProps({
          className: clsx('content', {
            'Mui-expanded': status.expanded,
            'Mui-selected': status.selected,
            'Mui-focused': status.focused,
            'Mui-disabled': status.disabled,
          }),
        })}
      >
        <TreeItem2IconContainer {...getIconContainerProps()}>
          <TreeItem2Icon status={status} />
        </TreeItem2IconContainer>
        <TreeItem2Checkbox {...getCheckboxProps()} />
        <Label {...getLabelProps({ icon, expandable: expandable && status.expanded ? 'true' : 'false' })} />
        <TreeItem2DragAndDropOverlay {...getDragAndDropOverlayProps()} />
      </Content>
      {children && <Collapse {...getGroupTransitionProps()} />}
    </TreeItem2Provider>
  );
});
