import React, { FC, useContext } from 'react';
import useStyles from './EditorAdd.styles';
import AddCircleIcon from '@material-ui/icons/AddCircle';
import { Box } from '@material-ui/core';
import {
  detectIsChildNode,
  moveQuestionToSpecificPosition,
  removeBeingPrecedingQuestion,
  removeFromSubQuestions,
  removePrecedingQuestion,
  sortRelatedQuestions
} from '../../utils/formBuilder';
import { Constants } from 's-forms';
import FormStructureNode from '../../model/FormStructureNode';
import { FormStructureContext } from '../../contexts/FormStructureContext';

type Props = {
  parentId: string;
  position: number;
};

const EditorAdd: FC<Props> = ({ parentId, position }) => {
  const classes = useStyles();

  const { formStructure, getClonedFormStructure, setFormStructure } = useContext(FormStructureContext);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();

    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    if ((e.target as HTMLDivElement).classList.contains(classes.addLine)) {
      const movingNode = formStructure.getNode(e.dataTransfer.types.slice(-1)[0]);
      const targetNode = formStructure.getNode(parentId);

      // if target element is child of moving element => no highlight
      if (movingNode && targetNode && detectIsChildNode(movingNode, targetNode)) {
        return;
      }

      (e.target as HTMLDivElement).classList.add(classes.overAdd);

      e.dataTransfer.dropEffect = 'move';
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    if ((e.target as HTMLDivElement).classList.contains(classes.addLine)) {
      (e.target as HTMLDivElement).classList.remove(classes.overAdd);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    if ((e.target as HTMLDivElement).classList.contains(classes.addLine)) {
      e.preventDefault();

      document
        .querySelectorAll('*:not([data-droppable=true]):not([draggable=true])')
        .forEach((element) => ((element as HTMLDivElement | HTMLLIElement).style.pointerEvents = 'all'));

      [].forEach.call(document.querySelectorAll('[data-droppable=true]'), (el: HTMLDivElement) => {
        el.classList.remove(classes.overAdd);
      });

      const movingNodeId = e.dataTransfer.types.slice(-1)[0];
      e.dataTransfer.clearData();

      const movingNode = formStructure.getNode(movingNodeId);
      const targetNode = formStructure.getNode(parentId);

      if (!movingNode || !targetNode) {
        console.warn('Missing movingNode or targetNode');
        return;
      }

      // if target element is child of moving element => no moving allowed
      if (movingNode && targetNode && detectIsChildNode(movingNode, targetNode)) {
        return;
      }

      moveNodes(movingNodeId, parentId);
    }
  };

  const moveNodes = (movingNodeId: string, targetNodeId: string) => {
    const clonedFormStructure = getClonedFormStructure();

    const movingNode = clonedFormStructure.getNode(movingNodeId);
    const targetNode = clonedFormStructure.getNode(targetNodeId);

    if (!movingNode?.data || !movingNode?.parent || !targetNode?.data) {
      console.error("Missing movingNode' questionData or parent, or targetNode's questionData");
      return;
    }

    const movingNodeParent = movingNode.parent;

    removePrecedingQuestion(movingNode);

    removeBeingPrecedingQuestion(movingNodeParent, movingNode);

    const removedIndex = removeFromSubQuestions(movingNodeParent, movingNode);

    // if moving node within one parent from top to down, position is decreased by one, because node is deleted 1 line before
    if (movingNodeParent.data['@id'] === targetNode.data['@id'] && removedIndex < position) {
      position--;
    }

    moveQuestionToSpecificPosition(position, targetNode, movingNode);

    targetNode.data[Constants.HAS_SUBQUESTION] = sortRelatedQuestions(targetNode.data[Constants.HAS_SUBQUESTION]);

    setFormStructure(clonedFormStructure);
  };

  const addNewQuestion = () => {
    const clonedFormStructure = getClonedFormStructure();

    const id = Math.floor(Math.random() * 10000) + 'editoradd';

    // temporary
    const newQuestion = {
      '@id': id,
      '@type': 'http://onto.fel.cvut.cz/ontologies/documentation/question',
      [Constants.HAS_LAYOUT_CLASS]: ['new'],
      [Constants.RDFS_LABEL]: id,
      [Constants.HAS_SUBQUESTION]: []
    };

    const targetNode = clonedFormStructure.getNode(parentId);

    if (!targetNode) {
      console.error('Missing targetNode');
      return;
    }

    const node = new FormStructureNode(targetNode, newQuestion);

    clonedFormStructure.addNode(newQuestion['@id'], node);

    moveQuestionToSpecificPosition(position, targetNode, node);

    targetNode.data[Constants.HAS_SUBQUESTION] = sortRelatedQuestions(targetNode.data[Constants.HAS_SUBQUESTION]);

    setFormStructure(clonedFormStructure);
  };

  return (
    <div
      className={classes.addLine}
      data-droppable={true}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={addNewQuestion}
    >
      <AddCircleIcon fontSize={'large'} />
    </div>
  );
};

export default EditorAdd;
