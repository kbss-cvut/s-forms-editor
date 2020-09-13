import React, { FC, useContext, useRef, useState } from 'react';
import useStyles, { CustomisedAccordionDetails } from './PageItem.styles';
import { Accordion } from '@material-ui/core';
import { Constants } from 's-forms';
import { highlightQuestion, sortRelatedQuestions, enableNotDraggableAndDroppable } from '@utils/index';
import PageItemHeader from '@components/pages/PageItemHeader/PageItemHeader';
import PageContent from '@components/pages/PageItemContent/PageItemContent';
import { DIRECTION } from '@enums/index';
import { FormStructureContext } from '@contexts/FormStructureContext';
import { FormStructureQuestion } from '@model/FormStructureQuestion';
import AddIcon from '@material-ui/icons/Add';
import { CustomiseItemContext, OnSaveCallback } from '@contexts/CustomiseItemContext';
import classNames from 'classnames';

type PageItemProps = {
  empty: boolean;
  index: number;
  question: FormStructureQuestion;
  buildFormUI: (
    question: FormStructureQuestion,
    position: number,
    parentQuestion: FormStructureQuestion
  ) => JSX.Element;
};

const PageItem: FC<PageItemProps> = ({ question, buildFormUI, index, empty }) => {
  const classes = useStyles();
  const pageContainer = useRef<HTMLDivElement | null>(null);

  const [expanded, setExpanded] = useState<boolean>(true);

  const { getClonedFormStructure, setFormStructure, moveNodeUnderNode, addNewNode, updateNode } = useContext(
    FormStructureContext
  );
  const { customiseItemData } = useContext(CustomiseItemContext);

  const handleMouseEnter = () => {
    pageContainer.current?.classList.add(classes.pageHover);
  };

  const handleMouseLeave = () => {
    pageContainer.current?.classList.remove(classes.pageHover);
  };

  const handleMouseOver = (e: React.MouseEvent<HTMLDivElement>) => {
    const correct = (e.target as HTMLDivElement).id === question['@id'];

    if (correct && !pageContainer.current?.classList.contains(classes.pageHover)) {
      pageContainer.current?.classList.add(classes.pageHover);
    } else if (!correct && pageContainer.current?.classList.contains(classes.pageHover)) {
      pageContainer.current?.classList.remove(classes.pageHover);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();

    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    if ((e.target as HTMLDivElement).classList.contains(classes.page)) {
      (e.target as HTMLDivElement).classList.add(classes.pageDragOver);
      e.dataTransfer.dropEffect = 'move';
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    if ((e.target as HTMLDivElement).classList.contains(classes.page)) {
      (e.target as HTMLDivElement).classList.remove(classes.pageDragOver);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    if ((e.target as HTMLDivElement).classList.contains(classes.page)) {
      e.preventDefault();

      (e.target as HTMLDivElement).style.opacity = '1';

      enableNotDraggableAndDroppable();

      [].forEach.call(document.getElementsByClassName(classes.page), (page: HTMLDivElement) => {
        page.classList.remove(classes.pageDragOver);
      });

      const destinationPageId = (e.target as HTMLDivElement).id;
      const movingNodeId = e.dataTransfer.types.slice(-1)[0];

      e.dataTransfer.clearData();

      if (!destinationPageId || !movingNodeId) {
        console.warn('Missing destinationPageId or movingNodeId', destinationPageId, movingNodeId);
        return;
      }

      moveNodeUnderNode(movingNodeId, destinationPageId);
    }
  };

  const addNewPage = (e: React.MouseEvent) => {
    e.stopPropagation();

    const clonedFormStructure = getClonedFormStructure();

    const root = clonedFormStructure.getRoot();

    if (!root) {
      console.error('Missing root', clonedFormStructure);
      return;
    }

    const precedingQuestion: FormStructureQuestion | undefined =
      root.data[Constants.HAS_SUBQUESTION] && root.data[Constants.HAS_SUBQUESTION]?.length
        ? root.data[Constants.HAS_SUBQUESTION]![root.data[Constants.HAS_SUBQUESTION]!.length - 1]
        : undefined;

    const newPage = {
      ...question,
      [Constants.HAS_PRECEDING_QUESTION]: precedingQuestion
        ? {
            '@id': precedingQuestion['@id']
          }
        : undefined
    };

    customiseItemData({
      itemData: newPage,
      onSave: (): OnSaveCallback => (itemData) => addNewNode(itemData, root, clonedFormStructure),
      onCancel,
      onInit,
      isNew: true
    });
  };

  const movePage = (e: React.MouseEvent, id: string, direction: DIRECTION) => {
    e.stopPropagation();

    const clonedFormStructure = getClonedFormStructure();

    const root = clonedFormStructure.getRoot();
    const rootSubQuestions = root.data[Constants.HAS_SUBQUESTION];

    const movingPage = clonedFormStructure.getNode(id);

    if (!movingPage || !rootSubQuestions) {
      console.warn('Missing movingPage or rootSubQuestions', movingPage, rootSubQuestions);
      return;
    }

    const movingPageData = movingPage.data;

    const movingPagePrecedingQuestion = movingPageData[Constants.HAS_PRECEDING_QUESTION];
    const movingPageIndex = rootSubQuestions.findIndex((q) => q['@id'] === id);

    if (direction === DIRECTION.UP && movingPageIndex !== 0) {
      const precending: FormStructureQuestion = rootSubQuestions[movingPageIndex - 1];

      movingPageData[Constants.HAS_PRECEDING_QUESTION] = precending[Constants.HAS_PRECEDING_QUESTION];

      if (movingPageIndex < rootSubQuestions.length - 1) {
        const following: FormStructureQuestion = rootSubQuestions[movingPageIndex + 1];

        precending[Constants.HAS_PRECEDING_QUESTION] = following[Constants.HAS_PRECEDING_QUESTION];

        following[Constants.HAS_PRECEDING_QUESTION] = movingPagePrecedingQuestion;
      } else {
        precending[Constants.HAS_PRECEDING_QUESTION] = {
          '@id': movingPageData['@id']
        };
      }
    } else if (direction === DIRECTION.DOWN && movingPageIndex !== rootSubQuestions.length - 1) {
      const three: FormStructureQuestion = rootSubQuestions[movingPageIndex + 1];

      if (movingPageIndex + 2 < rootSubQuestions.length) {
        const four: FormStructureQuestion = rootSubQuestions[movingPageIndex + 2]; //
        movingPageData[Constants.HAS_PRECEDING_QUESTION] = four[Constants.HAS_PRECEDING_QUESTION];

        four[Constants.HAS_PRECEDING_QUESTION] = three[Constants.HAS_PRECEDING_QUESTION];

        three[Constants.HAS_PRECEDING_QUESTION] = movingPagePrecedingQuestion;
      } else {
        three[Constants.HAS_PRECEDING_QUESTION] = movingPagePrecedingQuestion;

        movingPageData[Constants.HAS_PRECEDING_QUESTION] = {
          '@id': three['@id']
        };
      }
    }

    root.data[Constants.HAS_SUBQUESTION] = sortRelatedQuestions(rootSubQuestions);

    setFormStructure(clonedFormStructure);

    highlightQuestion(id);
  };

  const onClickHandler = (e: React.MouseEvent) => {
    e.stopPropagation();

    customiseItemData({
      itemData: question,
      onSave: () => (itemData: FormStructureQuestion) => {
        updateNode(itemData);
        highlightQuestion(itemData['@id']);
      },
      onCancel,
      onInit
    });
  };

  const onCancel = () => () => pageContainer.current?.classList.remove(classes.pageHighlight);

  const onInit = () => pageContainer.current?.classList.add(classes.pageHighlight);

  const expandPage = (e: React.MouseEvent): void => {
    e.stopPropagation();
    setExpanded(!expanded);
  };

  if (empty) {
    return (
      <div className={classNames(classes.page, classes.pageEmpty)} ref={pageContainer}>
        <Accordion expanded={expanded} className={classes.accordion} onClick={addNewPage} title={'Add new page'}>
          <CustomisedAccordionDetails>
            <AddIcon />
          </CustomisedAccordionDetails>
        </Accordion>
      </div>
    );
  }

  return (
    <div
      key={question['@id']}
      id={question['@id']}
      ref={pageContainer}
      className={classes.page}
      data-droppable={true}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={onClickHandler}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <Accordion expanded={expanded} className={classes.accordion}>
        <PageItemHeader
          question={question}
          movePage={movePage}
          position={index + 1}
          expandPage={expandPage}
          expanded={expanded}
        />
        <PageContent question={question} buildFormUI={buildFormUI} handleMouseOver={handleMouseOver} />
      </Accordion>
    </div>
  );
};

export default PageItem;
