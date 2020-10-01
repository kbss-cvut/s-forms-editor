import React, { FC, useContext } from 'react';
import { Constants, FormUtils } from 's-forms';
import Item from '@components/items/Item/Item';
import ItemAdd from '@components/items/ItemAdd/ItemAdd';
import { FormStructureContext } from '@contexts/FormStructureContext';
import { FormStructureQuestion } from '@model/FormStructureQuestion';
import useStyles from './EditorCustomize.styles';
import ItemSection from '@components/items/ItemSection/ItemSection';
import Sidebar from '@components/sidebars/Sidebar/Sidebar';
import ItemFormEmpty from '@components/items/ItemFormEmpty/ItemFormEmpty';

interface EditorCustomizeProps {}

const EditorCustomize: FC<EditorCustomizeProps> = ({}) => {
  const classes = useStyles();

  const { formStructure } = useContext(FormStructureContext);

  const buildFormUI = (
    question: FormStructureQuestion,
    position: number,
    parentQuestion: FormStructureQuestion
  ): JSX.Element => {
    const subquestions = question[Constants.HAS_SUBQUESTION];
    const topLevelPosition = FormUtils.isForm(parentQuestion);

    let item = null;

    if (
      FormUtils.isTypeahead(question) ||
      FormUtils.isCalendar(question) ||
      FormUtils.isCheckbox(question) ||
      FormUtils.isMaskedInput(question) ||
      FormUtils.isTextarea(question, '') ||
      !(FormUtils.isSection(question) || FormUtils.isWizardStep(question)) // text field
    ) {
      item = <Item question={question} position={position} />;
    } else {
      const isWizardStep = FormUtils.isWizardStep(question);

      return (
        <React.Fragment key={question['@id']}>
          {position === 0 && (
            <ItemAdd
              parentQuestionId={parentQuestion['@id']}
              position={position}
              isWizardPosition={isWizardStep}
              topLevelPosition={topLevelPosition}
            />
          )}
          <ItemSection question={question} buildFormUI={buildFormUI} position={position} />
          <ItemAdd parentQuestionId={parentQuestion['@id']} position={position + 1} isWizardPosition={isWizardStep} />
        </React.Fragment>
      );
    }

    return (
      <React.Fragment key={question['@id']}>
        {position === 0 && (
          <ItemAdd parentQuestionId={parentQuestion['@id']} position={position} topLevelPosition={topLevelPosition} />
        )}
        {item}
        {subquestions && (
          <ol id={question['@id']} className={classes.olPaddingLeft}>
            {subquestions.map((subquestion, index) => buildFormUI(subquestion, index, question))}
          </ol>
        )}
        <ItemAdd parentQuestionId={parentQuestion['@id']} position={position + 1} />
      </React.Fragment>
    );
  };

  const rootSubquestions = formStructure.root.data[Constants.HAS_SUBQUESTION];

  return (
    <div>
      <ol className={classes.form}>
        {!rootSubquestions?.length && <ItemFormEmpty key={'empty-page'} />}

        {rootSubquestions?.map((subquestion, index) => buildFormUI(subquestion, index, formStructure.root.data))}
      </ol>
      <Sidebar />
    </div>
  );
};

export default EditorCustomize;
