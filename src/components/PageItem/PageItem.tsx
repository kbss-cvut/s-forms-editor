import React, { FC, useContext } from 'react';
import FormStructureNode from '@model/FormStructureNode';
import useStyles, { CustomisedAccordionDetails } from './PageItem.styles';
import { Accordion } from '@material-ui/core';
import { Constants } from 's-forms';
import { highlightQuestion, moveQuestion, sortRelatedQuestions } from '@utils/formBuilder';
import PageItemHeader from '@components/PageItemHeader/PageItemHeader';
import PageContent from '@components/PageItemContent/PageItemContent';
import { DIRECTION } from '@enums/index';
import { FormStructureContext } from '@contexts/FormStructureContext';
import { FormStructureQuestion } from '@model/FormStructureQuestion';
import AddIcon from '@material-ui/icons/Add';
import { enableNotDraggableAndDroppable } from '@utils/itemDragHelpers';

type Props = {
  question: FormStructureQuestion;
  buildFormUI: (
    question: FormStructureQuestion,
    position: number,
    parentQuestion: FormStructureQuestion
  ) => JSX.Element;
};

const PageItem: FC<Props> = ({ question, buildFormUI }) => {
  const classes = useStyles();

  const { getClonedFormStructure, setFormStructure, moveNodeUnderNode } = useContext(FormStructureContext);

  const relatedQuestions = question[Constants.HAS_SUBQUESTION];

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();

    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    if ((e.target as HTMLDivElement).classList.contains(classes.page)) {
      (e.target as HTMLDivElement).classList.add(classes.pageOver);
      e.dataTransfer.dropEffect = 'move';
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    if ((e.target as HTMLDivElement).classList.contains(classes.page)) {
      (e.target as HTMLDivElement).classList.remove(classes.pageOver);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    if ((e.target as HTMLDivElement).classList.contains(classes.page)) {
      e.preventDefault();

      (e.target as HTMLDivElement).style.opacity = '1';

      enableNotDraggableAndDroppable();

      [].forEach.call(document.getElementsByClassName(classes.page), (page: HTMLDivElement) => {
        page.classList.remove(classes.pageOver);
      });

      const destinationPageId = (e.target as HTMLDivElement).id;
      const movingNodeId = e.dataTransfer.types.slice(-1)[0];

      e.dataTransfer.clearData();

      if (!destinationPageId || !movingNodeId) {
        console.warn('Missing destinationPageId or movingNodeId');
        return;
      }

      moveNodeUnderNode(movingNodeId, destinationPageId);
    }
  };

  const addNewPage = () => {
    const clonedFormStructure = getClonedFormStructure();

    const id = Math.floor(Math.random() * 10000) + 'editorwizard-page';

    const root = clonedFormStructure.getRoot();

    if (!root) {
      console.error('Missing root');
      return;
    }

    const precedingQuestion: FormStructureQuestion | undefined =
      root.data[Constants.HAS_SUBQUESTION] && root.data[Constants.HAS_SUBQUESTION]?.length
        ? root.data[Constants.HAS_SUBQUESTION]![root.data[Constants.HAS_SUBQUESTION]!.length - 1]
        : undefined;

    // temporary
    const newPage = {
      '@id': id,
      '@type': 'http://onto.fel.cvut.cz/ontologies/documentation/question',
      [Constants.LAYOUT_CLASS]: ['section', 'wizard-step'],
      [Constants.RDFS_LABEL]: id,
      [Constants.HAS_SUBQUESTION]: [],
      [Constants.HAS_PRECEDING_QUESTION]: precedingQuestion
        ? {
            '@id': precedingQuestion['@id']
          }
        : ''
    };

    const page = new FormStructureNode(root, newPage);

    clonedFormStructure.addNode(newPage['@id'], page);

    moveQuestion(page, root);

    root.data[Constants.HAS_SUBQUESTION] = sortRelatedQuestions(root.data[Constants.HAS_SUBQUESTION]);

    setFormStructure(clonedFormStructure);

    highlightQuestion(id);
  };

  const movePage = (id: string, direction: DIRECTION) => {
    const clonedFormStructure = getClonedFormStructure();

    const root = clonedFormStructure.getRoot();
    const rootSubQuestions = root.data[Constants.HAS_SUBQUESTION];

    const movingPage = clonedFormStructure.getNode(id);

    if (!movingPage || !rootSubQuestions) {
      console.warn('Missing movingPage or rootSubQuestions');
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

  return (
    <React.Fragment>
      {relatedQuestions &&
        relatedQuestions.map((q, index) => (
          <div
            key={q['@id']}
            id={q['@id']}
            className={classes.page}
            data-droppable={true}
            onDragOver={handleDragOver}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <Accordion expanded={true} className={classes.accordion}>
              <PageItemHeader question={q} movePage={movePage} position={index + 1} />
              <PageContent question={q} buildFormUI={buildFormUI} />
            </Accordion>
          </div>
        ))}
      <div className={classes.page}>
        <Accordion expanded={true} className={classes.accordion} onClick={addNewPage} title={'Add new page'}>
          <CustomisedAccordionDetails>
            <AddIcon />
          </CustomisedAccordionDetails>
        </Accordion>
      </div>
    </React.Fragment>
  );
};

export default PageItem;
