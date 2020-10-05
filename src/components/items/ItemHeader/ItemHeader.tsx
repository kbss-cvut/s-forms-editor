import React, { FC, useContext } from 'react';
import { Constants } from 's-forms';
import { DragIndicator, ExpandLess, ExpandMore } from '@material-ui/icons';
import useStyles, { CustomisedCardHeader } from './ItemHeader.styles';
import ItemMenu from '@components/items/ItemMenu/ItemMenu';
import { FormStructureQuestion } from '@model/FormStructureQuestion';
import ItemPropsIndicator from '@components/items/ItemPropsIndicator/ItemPropsIndicator';
// @ts-ignore
import JsonLdUtils from 'jsonld-utils';
import { EditorContext } from '@contexts/EditorContext';

type ItemHeaderProps = {
  container: React.MutableRefObject<HTMLLIElement | null>;
  question: FormStructureQuestion;
  position: number;
  expandable?: boolean;
  expanded?: boolean;
  expandItemSection?: (e: React.MouseEvent) => void;
};

const ItemHeader: FC<ItemHeaderProps> = ({
  container,
  question,
  position,
  expandable,
  expanded,
  expandItemSection
}) => {
  const classes = useStyles();

  const { languages } = useContext(EditorContext);

  const addDraggable = () => {
    container?.current?.setAttribute('draggable', 'true');
  };

  const removeDraggable = () => {
    container?.current?.setAttribute('draggable', 'false');
  };

  return (
    <CustomisedCardHeader
      title={
        <div className={classes.cardHeader} onMouseEnter={addDraggable} onMouseLeave={removeDraggable}>
          <span className={classes.cardHeaderItemLeft}>
            {expandable && (
              <div className={classes.expandableSection} title={expanded ? 'Collapse section' : 'Expand section'}>
                {expanded ? <ExpandLess onClick={expandItemSection} /> : <ExpandMore onClick={expandItemSection} />}
              </div>
            )}
            <DragIndicator className={classes.cardHeaderDrag} />
            <span>
              {position}.&nbsp;
              {JsonLdUtils.getLocalized(question[Constants.RDFS_LABEL], languages.length && { locale: languages[0] }) ||
                question['@id']}
            </span>
            <ItemPropsIndicator question={question} />
          </span>
          <span className={classes.cardHeaderItemRight} onMouseEnter={removeDraggable} onMouseLeave={addDraggable}>
            <ItemMenu question={question} />
          </span>
        </div>
      }
      disableTypography={true}
    />
  );
};

export default ItemHeader;
