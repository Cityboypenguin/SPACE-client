const URL_SPLIT_REGEX = /(https?:\/\/[^\s　　、。！？「」（）【】『』〔〕…‥・]+)/g;
const URL_TEST_REGEX = /^https?:\/\//;

type Props = {
  text: string;
  linkClassName?: string;
};

export const renderTextWithLinks = ({ text, linkClassName }: Props) => {
  const parts = text.split(URL_SPLIT_REGEX);
  return parts.map((part, i) =>
    URL_TEST_REGEX.test(part) ? (
      <a key={i} href={part} target="_blank" rel="noopener noreferrer" className={linkClassName}>
        {part}
      </a>
    ) : (
      part
    ),
  );
};