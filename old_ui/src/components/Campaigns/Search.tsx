import { Input } from '@/components/ui/input';

const Search = () => {
  return (
    <>
      <div className="flex items-center p-1 rounded-full  max-w-[30rem] w-full border border-primary/10 border-opacity-10 gap-1">
        <Input
          className="rounded-full py-3 w-full border-0 shadow-none focus-visible:ring-0"
          placeholder="Search"
        />
      </div>
    </>
  );
};

export default Search;
