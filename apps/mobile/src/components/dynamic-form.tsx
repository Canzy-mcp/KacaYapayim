import { Text, View } from "react-native";
import { evaluateCondition, type FieldValues, type ProfessionField, type ProfessionTemplate } from "@kacayapayim/core/professions/schema";
import { Choice, Field, SectionTitle, palette } from "./ui";
import { numberFromInput } from "@/src/lib/format";

function DynamicField({ field, value, onChange }: { field: ProfessionField; value: FieldValues[string];
  onChange: (value: FieldValues[string]) => void }) {
  if (["checkbox", "toggle"].includes(field.fieldType)) return <Choice title={field.label}
    selected={value === true} onPress={() => onChange(value !== true)} detail={field.description} />;
  if (field.fieldType === "select") return <View style={{ marginBottom: 12 }}>
    <Text style={{ fontSize: 14, color: palette.text, fontWeight: "600", marginBottom: 9 }}>{field.label}</Text>
    {field.options?.map(option => <Choice key={option.value} title={option.label} selected={value === option.value}
      onPress={() => onChange(option.value)} />)}</View>;
  if (field.fieldType === "multi_select") return <View style={{ marginBottom: 12 }}>
    <Text style={{ fontSize: 14, color: palette.text, fontWeight: "600", marginBottom: 9 }}>{field.label}</Text>
    {field.options?.map(option => { const selected = Array.isArray(value) && value.includes(option.value);
      return <Choice key={option.value} title={option.label} selected={selected}
        onPress={() => onChange(selected ? (value as string[]).filter(item => item !== option.value)
          : [...(Array.isArray(value) ? value : []), option.value])} />; })}</View>;
  const numeric = ["number", "currency", "integer", "percentage", "quantity"].includes(field.fieldType);
  return <View><Field label={`${field.label}${field.required ? " *" : ""}${field.unit ? ` (${field.unit})` : ""}`}
    value={value === null || value === undefined ? "" : String(value)} placeholder={field.placeholder}
    onChangeText={text => onChange(numeric ? text === "" ? null : numberFromInput(text) : text)}
    keyboardType={numeric ? "decimal-pad" : field.fieldType === "date" ? "numbers-and-punctuation" : "default"}
    multiline={field.fieldType === "textarea"} />
    {Boolean(field.description) && <Text style={{ color: palette.muted, fontSize: 12, marginTop: -12, marginBottom: 15 }}>{field.description}</Text>}
  </View>;
}

export function DynamicForm({ template, values, onChange }: { template: ProfessionTemplate; values: FieldValues;
  onChange: (values: FieldValues) => void }) {
  return <>{[...template.sections].sort((a, b) => a.sortOrder - b.sortOrder).map(section => {
    const fields = template.fields.filter(field => field.section === section.key && evaluateCondition(field.visibilityCondition, values))
      .sort((a, b) => a.sortOrder - b.sortOrder);
    if (!fields.length) return null;
    return <View key={section.key}><SectionTitle>{section.title}</SectionTitle>
      {Boolean(section.description) && <Text style={{ color: palette.muted, marginBottom: 12 }}>{section.description}</Text>}
      {fields.map(field => <DynamicField key={field.key} field={field}
        value={values[field.key] ?? field.defaultValue ?? null}
        onChange={value => onChange({ ...values, [field.key]: value })} />)}</View>;
  })}</>;
}
