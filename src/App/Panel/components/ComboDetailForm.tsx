import React, { Component, Fragment } from "react";
import { Input, Button } from "antd";
import { map, forEach, uniqueId, findIndex, filter } from "lodash";
import { Form as LegacyForm } from "@ant-design/compatible";
import { INode } from "@antv/g6/lib/interface/item";
import { NodeConfig, ComboConfig } from "@antv/g6/lib/types";
import { PanelProps } from "../../Panel";
import FormField from "./FormField";

const { Item } = LegacyForm;

interface FormState {
  nodes: Array<NodeConfig>;
  comboData: ComboData;
}

interface ComboData {
  comboId: string;
  title: string;
  desc: string;
}

enum FIELD_STATUS {
  DELETED = "DELETED",
  ADD = "ADD",
}

class ComboDetailForm extends Component<PanelProps, FormState> {
  constructor(props) {
    super(props);
    this.state = {
      ...this.initState(props),
      // nodes: [],
      // comboData: { comboId: "", title: "", desc: "" },
    };
    console.log("constructor>>>>>>>");
  }

  // componentDidMount() {
  //   console.log("componentDidMount>>>>>>>");
  //   this.setState({
  //     ...this.initState(this.props)
  //   })
  // }
  
  initState = (props): FormState => {
    const { combos } = props;
    const combo = combos[0];
    const nodes: INode[] = combo.getNodes();
    const comboConfig = combo.getModel() as ComboConfig;
    const { id: comboId } = comboConfig;
    const data = comboConfig.data as object;
    const childNodes: Array<NodeConfig> = [];
    forEach(nodes, (node) => {
      childNodes.push(node.getModel() as NodeConfig);
    });
    return {
      nodes: childNodes,
      comboData: { comboId, ...data } as ComboData,
    };
  };

  handleSubmit = (e: React.FocusEvent<HTMLInputElement>) => {
    if (e && e.preventDefault) {
      e.preventDefault();
    }

    const { form } = this.props;

    form.validateFieldsAndScroll((err, values) => {
      if (err) {
        return;
      }

      // const { type, combos, nodes, edges, executeCommand } = this.props;

      // const item = type === "node" ? nodes[0] : edges[0];

      // if (!item) {
      //   return;
      // }

      // executeCommand("update", {
      //   id: item.get("id"),
      //   updateModel: {
      //     ...values,
      //   },
      // });
    });
  };

  addField = () => {
    const {
      nodes,
      comboData: { comboId },
    } = this.state;
    const node = {
      comboId,
      id: uniqueId(),
      data: {},
      fieldStatus: FIELD_STATUS.ADD,
    } as NodeConfig;
    nodes.push(node);
    this.setState({ nodes });
  };

  delField = (node: NodeConfig) => {
    const { nodes } = this.state;
    const { fieldStatus } = node;
    const index = findIndex(nodes, (o) => {
      return o.id === node.id;
    });
    if (index !== -1) {
      if (fieldStatus === FIELD_STATUS.ADD) {
        nodes.splice(index, 1);
      } else {
        nodes[index].fieldStatus = FIELD_STATUS.DELETED;
      }
      this.setState({ nodes });
    }
  };

  saveCombo = () => {
    const { nodes } = this.state;
    const { form, graph } = this.props;
    form.validateFields((err, values) => {
      if (err) {
        return;
      }
      const { title, desc, ...rest } = values;
      const { executeCommand } = this.props;
      map(Object.values(rest), (node) => {
        if (node.fieldStatus === FIELD_STATUS.ADD) {
          // executeCommand("update", {
          //   id: node.id,
          //   updateModel: {
          //     ...node,
          //   },
          // });
        } else if (node.fieldStatus === FIELD_STATUS.DELETED) {
          console.log('remove>>>>>>', node.id)
          graph.removeItem(node.id);
          graph.updateCombos();
          // executeCommand("remove", {
          //   id: node.id
          // });
        } else {
          executeCommand("update", {
            id: node.id,
            updateModel: {
              ...node,
            },
          });
        }
      });
    });
  };

  delCombo = () => {
    const {
      comboData: { comboId },
    } = this.state;
    console.log("delCombo>>>>>", comboId);
  };

  renderForm = () => {
    const { comboData, nodes } = this.state;
    const { form } = this.props;

    const visibleNodes = filter(nodes, (node) => {
      return node.fieldStatus !== FIELD_STATUS.DELETED;
    });

    const formItems = map(visibleNodes, (node: NodeConfig, index: number) => {
      const { id } = node;
      return (
        <Item key={`field_${id}`} label={`字段${index + 1}`}>
          {form.getFieldDecorator(`field_${id}`, {
            initialValue: node || {},
          })(<FormField onDel={this.delField} />)}
        </Item>
      );
    });

    const { title, desc } = comboData;

    return (
      <LegacyForm>
        <Item label="title">
          {form.getFieldDecorator("title", {
            initialValue: title || "",
          })(<Input />)}
        </Item>
        <Item label="desc">
          {form.getFieldDecorator("desc", {
            initialValue: desc || "",
          })(<Input />)}
        </Item>
        {formItems}
        <Button onClick={this.addField}>添加字段</Button>
        <Button onClick={this.saveCombo}>保存节点</Button>
        <Button onClick={this.delCombo}>删除节点</Button>
      </LegacyForm>
    );
  };

  render() {
    return <Fragment>{this.renderForm()}</Fragment>;
  }
}

export default LegacyForm.create()(ComboDetailForm);