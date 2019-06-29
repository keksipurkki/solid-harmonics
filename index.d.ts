type AnyGenerator<T> = (...args: any[]) => IterableIterator<T>;
type Predicate<T> = (input: T) => boolean;

type Tail<T extends any[]> = ((...args: T) => any) extends ((head: any, ...tail: infer U) => any) ? U : never;

interface NDArray<S extends any[], V = number> {
  [i: number]: S extends [number] ? V : NDArray<Tail<S>>;
  length: number;
}

type NDAllocator<V> = <Shape extends [number, ...number[]]>(...shape: Shape) => NDArray<Shape, V>;
